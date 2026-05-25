"""Génération de plan alimentaire 7 jours via RAG + OpenAI."""

import json
import re
import os
from openai import OpenAI

DIET_RULES = {
    "Low_Carb": (
        "- Maximum 100g de glucides par jour\n"
        "- Protéines élevées : 120-150g par jour\n"
        "- Graisses saines : 60-80g par jour\n"
        "- Éviter : pain, riz, pâtes, sucres ajoutés"
    ),
    "Low_Sodium": (
        "- Maximum 1500mg de sodium par jour\n"
        "- Pas d'aliments transformés ni de charcuterie\n"
        "- Utiliser des herbes fraîches au lieu du sel\n"
        "- Privilégier les aliments frais et entiers"
    ),
    "Balanced": (
        "- ~50% glucides, 25% protéines, 25% lipides\n"
        "- Céréales complètes, légumes, protéines maigres\n"
        "- Modération des sucres ajoutés et graisses saturées"
    ),
    "High_Protein": (
        "- Protéines : 1.6-2.2g par kg de poids corporel\n"
        "- Sources variées : poulet, poisson, œufs, légumineuses\n"
        "- Glucides modérés autour des entraînements"
    ),
    "Low_Fat": (
        "- Maximum 30% des calories provenant des lipides\n"
        "- Cuissons sans matière grasse : vapeur, four, grillé\n"
        "- Protéines maigres : poulet sans peau, poisson, blancs d'œufs\n"
        "- Produits laitiers à 0% MG"
    ),
}


def _build_prompt(profile: dict, similar: list) -> str:
    examples = []
    for i, p in enumerate(similar[:3], 1):
        doc = p["document"]
        start = doc.find("Sample Meal Plan:")
        end = doc.find("Key Foods to Include:")
        if start != -1 and end != -1:
            plan = doc[start + 17:end].strip()
            examples.append(
                f"Exemple {i} (Patient {p['metadata']['patient_id']}, "
                f"similarité {p['similarity']:.2f}):\n{plan}"
            )

    rules = DIET_RULES.get(
        profile["diet_type"],
        "- Suivre les recommandations nutritionnelles générales équilibrées"
    )

    return f"""Tu es un nutritionniste clinique IA. Génère un plan de repas personnalisé de 7 jours EN FRANÇAIS.

PROFIL DU PATIENT:
- Âge: {profile['age']} ans, Sexe: {profile['gender']}
- Poids: {profile['weight_kg']} kg, IMC: {profile['bmi']}
- État de santé: {profile['disease']} (sévérité {profile['severity']})
- Activité physique: {profile['activity_level']}
- Calories cibles: {profile['target_calories']} kcal/jour
- Objectif: {profile['goal']}
- Cuisine préférée: {profile['cuisine']}
- Allergies: {profile.get('allergies', 'Aucune')}
- Restrictions: {profile.get('dietary_restrictions', 'Aucune')}

TYPE DE RÉGIME: {profile['diet_type']}
Règles spécifiques:
{rules}

EXEMPLES DE PATIENTS SIMILAIRES:
{chr(10).join(examples) if examples else 'Aucun exemple disponible.'}

TÂCHE: Plan complet 7 jours (Lundi → Dimanche), 3 repas/jour.
Pour chaque repas : nom EN FRANÇAIS + calories + macros (protéines, glucides, lipides en g).

RÈGLES: cuisine {profile['cuisine']} respectée — allergies évitées — ~{profile['target_calories']} kcal/jour — pas de répétitions exactes.

FORMAT JSON STRICT (uniquement ce JSON, rien d'autre):
{{
  "Lundi": {{
    "petit_dejeuner": {{"repas": "...", "calories": 0, "proteines": 0, "glucides": 0, "lipides": 0}},
    "dejeuner":       {{"repas": "...", "calories": 0, "proteines": 0, "glucides": 0, "lipides": 0}},
    "diner":          {{"repas": "...", "calories": 0, "proteines": 0, "glucides": 0, "lipides": 0}}
  }},
  "Mardi": {{...}}, "Mercredi": {{...}}, "Jeudi": {{...}},
  "Vendredi": {{...}}, "Samedi": {{...}}, "Dimanche": {{...}}
}}"""


def generate(profile: dict, retriever, n_examples: int = 5) -> dict:
    """
    Pipeline complet : retrieval → prompt → OpenAI → JSON.

    Args:
        profile: dict avec age, gender, weight_kg, bmi, disease, severity,
                 diet_type, goal, activity_level, target_calories, cuisine,
                 allergies, dietary_restrictions.
        retriever: instance RAGRetriever (déjà chargée, partagée).
    """
    similar = retriever.find_similar(profile, n=n_examples)
    if not similar:
        raise ValueError("Aucun patient similaire trouvé dans la base vectorielle.")

    prompt = _build_prompt(profile, similar)

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": "Tu es un nutritionniste clinique. Réponds uniquement en JSON valide, en français."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=3000,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    cleaned = re.sub(r'^```json\s*', '', raw.strip())
    cleaned = re.sub(r'```\s*$', '', cleaned)
    meal_plan = json.loads(cleaned)

    return {
        "meal_plan": meal_plan,
        "sources": [
            {
                "patient_id":   p["metadata"]["patient_id"],
                "similarity":   p["similarity"],
                "age_diff":     p["age_diff"],
                "calorie_diff": p["calorie_diff"],
            }
            for p in similar
        ],
        "tokens_used": response.usage.total_tokens,
    }
