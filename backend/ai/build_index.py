"""
Script de freeze — à exécuter UNE SEULE FOIS.

    cd backend
    python -m ai.build_index

Lit diet_with_meals.csv, construit les chunks RAG, les embed avec
BAAI/bge-base-en-v1.5 et les stocke dans ChromaDB (./ai/chroma_db).
Après ce script, la base vectorielle est figée ; le serveur Flask
ne fera que des lectures (get_collection, query).
"""

import json
import os
import sys
from pathlib import Path

import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer

EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"
COLLECTION_NAME = "nutrition_patients"

SCRIPT_DIR = Path(__file__).parent
CSV_PATH   = SCRIPT_DIR.parent / "diet_with_meals.csv"
DB_PATH    = SCRIPT_DIR / "chroma_db"


# ── 0. Goal column (absent du CSV si notebook arrêté avant Cell 18) ───────────

def _assign_goal(row) -> str:
    cat  = row["BMI_Category"]
    diet = row["Diet_Recommendation"]
    dis  = str(row["Disease_Type"])
    if cat == "Underweight":
        return "Weight Gain"
    if cat == "Obese":
        return "Weight Loss"
    if cat == "Overweight":
        return "Weight Loss"
    # Normal
    if diet == "High_Protein":
        return "Muscle Gain"
    if dis.lower() not in ("none", "nan", ""):
        return "Condition Management"
    return "Maintenance"


# ── 1. chunk builder ──────────────────────────────────────────────────────────

def _build_chunk(row) -> dict:
    summary = (
        f"{row['Age']}-year-old {row['Gender'].lower()} | "
        f"BMI {row['BMI']} {row['BMI_Category'].lower()} | "
        f"{row['Disease_Type']} | "
        f"{row['Diet_Recommendation']} diet for {row['Goal']} | "
        f"{row['Daily_Caloric_Intake']} kcal/day | "
        f"{row['Physical_Activity_Level']} activity"
    )
    text = f"""SUMMARY: {summary}

Patient Profile:
- ID: {row['Patient_ID']}
- Demographics: {row['Age']} years old, {row['Gender']}, {row['Age_Group']}
- Body Metrics: Weight {row['Weight_kg']}kg, Height {row['Height_cm']}cm, BMI {row['BMI']} ({row['BMI_Category']})
- Health Status: {row['Disease_Type']} ({row['Severity']} severity)
- Activity Level: {row['Physical_Activity_Level']} — {row['Weekly_Exercise_Hours']} hours/week
- Goal: {row['Goal']}

Clinical Markers:
- Daily Caloric Intake: {row['Daily_Caloric_Intake']} kcal
- Cholesterol: {row['Cholesterol_mg/dL']} mg/dL {'(HIGH)' if row['High_Cholesterol'] == 1 else '(normal)'}
- Blood Pressure: {row['Blood_Pressure_mmHg']} mmHg {'(HIGH)' if row['High_BP'] == 1 else '(normal)'}
- Blood Glucose: {row['Glucose_mg/dL']} mg/dL {'(HIGH)' if row['High_Glucose'] == 1 else '(normal)'}
- Metabolic Risk: {row['Metabolic_Risk']}

Dietary Profile:
- Recommended Diet: {row['Diet_Recommendation']}
- Dietary Restrictions: {row['Dietary_Restrictions']}
- Allergies: {row['Allergies']}
- Preferred Cuisine: {row['Preferred_Cuisine']}

Sample Meal Plan:
{row['meal_plan_example']}

Key Foods to Include:
{row['key_foods']}

Foods to Avoid:
{row['foods_to_avoid']}""".strip()

    metadata = {
        "patient_id":       str(row["Patient_ID"]),
        "age":              int(row["Age"]),
        "age_group":        str(row["Age_Group"]),
        "gender":           str(row["Gender"]),
        "bmi":              float(row["BMI"]),
        "bmi_category":     str(row["BMI_Category"]),
        "disease":          str(row["Disease_Type"]),
        "severity":         str(row["Severity"]),
        "diet_type":        str(row["Diet_Recommendation"]),
        "goal":             str(row["Goal"]),
        "activity_level":   str(row["Physical_Activity_Level"]),
        "calories":         int(row["Daily_Caloric_Intake"]),
        "high_cholesterol": int(row["High_Cholesterol"]),
        "high_bp":          int(row["High_BP"]),
        "high_glucose":     int(row["High_Glucose"]),
        "metabolic_risk":   str(row["Metabolic_Risk"]),
        "cuisine":          str(row["Preferred_Cuisine"]),
        "allergies":        str(row["Allergies"]),
        "restrictions":     str(row["Dietary_Restrictions"]),
    }
    return {"text": text, "metadata": metadata}


# ── 2. main ───────────────────────────────────────────────────────────────────

def main():
    if not CSV_PATH.exists():
        print(f"❌  Fichier introuvable : {CSV_PATH}")
        print("    Place diet_with_meals.csv dans backend/ puis relance.")
        sys.exit(1)

    print(f"📂  Lecture de {CSV_PATH} …")
    df = pd.read_csv(CSV_PATH)
    print(f"    {len(df)} lignes × {df.shape[1]} colonnes")

    if "Goal" not in df.columns:
        print("    Colonne 'Goal' absente — calcul automatique …")
        df["Goal"] = df.apply(_assign_goal, axis=1)

    print("🔧  Construction des chunks RAG …")
    chunks = [_build_chunk(row) for _, row in df.iterrows()]
    print(f"    {len(chunks)} chunks générés")

    print(f"🤖  Chargement du modèle {EMBEDDING_MODEL} …")
    model = SentenceTransformer(EMBEDDING_MODEL)
    print(f"    Dimensions : {model.get_sentence_embedding_dimension()}")

    print("📐  Embedding en batch (peut prendre 3-5 min) …")
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(
        texts, batch_size=32, show_progress_bar=True, convert_to_numpy=True
    ).tolist()

    print(f"💾  Écriture dans ChromaDB → {DB_PATH} …")
    DB_PATH.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(DB_PATH))

    try:
        client.delete_collection(COLLECTION_NAME)
        print("    Collection existante supprimée.")
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={
            "embedding_model": EMBEDDING_MODEL,
            "dimensions": model.get_sentence_embedding_dimension(),
        },
    )

    collection.add(
        ids=[c["metadata"]["patient_id"] for c in chunks],
        embeddings=embeddings,
        documents=texts,
        metadatas=[c["metadata"] for c in chunks],
    )

    print(f"\n✅  Index figé — {collection.count()} patients dans la base vectorielle.")
    print(f"    Chemin : {DB_PATH.resolve()}")
    print("    Lance maintenant le serveur Flask normalement.")


if __name__ == "__main__":
    main()
