"""RAGRetriever — charge le ChromaDB déjà peuplé et fait la recherche hybride."""

import chromadb
from sentence_transformers import SentenceTransformer

EMBEDDING_MODEL = 'BAAI/bge-base-en-v1.5'
COLLECTION_NAME = 'nutrition_patients'


class RAGRetriever:
    """
    Hybrid retrieval: semantic similarity + numerical proximity (age, calories, BMI).
    Le ChromaDB doit être peuplé au préalable via build_index.py.
    """

    def __init__(self, db_path: str):
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_collection(COLLECTION_NAME)
        self.model = SentenceTransformer(EMBEDDING_MODEL)

    def find_similar(self, profile: dict, n: int = 5) -> list[dict]:
        summary = (
            f"{profile['age']}-year-old {profile['gender'].lower()} | "
            f"BMI {profile['bmi']} | {profile['disease']} | "
            f"{profile['diet_type']} diet for {profile['goal']} | "
            f"{profile['target_calories']} kcal/day | {profile['activity_level']} activity"
        )
        embedding = self.model.encode([f"SUMMARY: {summary}"])[0].tolist()

        conditions = [
            {"gender": profile["gender"]},
            {"diet_type": profile["diet_type"]},
            {"goal": profile["goal"]},
        ]
        where = {"$and": conditions}

        raw = self.collection.query(
            query_embeddings=[embedding],
            n_results=min(n * 4, self.collection.count()),
            where=where,
        )

        candidates = []
        for doc, meta, dist in zip(
            raw["documents"][0], raw["metadatas"][0], raw["distances"][0]
        ):
            sem = max(0.0, 1.0 - dist)
            age_sim = max(0, 1 - abs(meta["age"] - profile["age"]) / 30)
            cal_sim = max(0, 1 - abs(meta["calories"] - profile["target_calories"]) / 1000)
            bmi_sim = max(0, 1 - abs(meta["bmi"] - profile["bmi"]) / 15)
            score = 0.40 * sem + 0.25 * age_sim + 0.20 * cal_sim + 0.15 * bmi_sim
            candidates.append({
                "document":     doc,
                "metadata":     meta,
                "similarity":   round(score, 3),
                "semantic":     round(sem, 3),
                "age_diff":     abs(meta["age"] - profile["age"]),
                "calorie_diff": abs(meta["calories"] - profile["target_calories"]),
            })

        candidates.sort(key=lambda x: -x["similarity"])
        return candidates[:n]
