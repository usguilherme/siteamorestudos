import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Question, Attempt, ErrorReason } from "@/types";

/** Busca todas as questões de um tópico (assunto). */
export async function getQuestionsByTopic(topicId: string): Promise<Question[]> {
  const q = query(collection(db, "questions"), where("topicId", "==", topicId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Question));
}

/** Busca uma questão específica pelo id. */
export async function getQuestionById(id: string): Promise<Question | null> {
  const ref = doc(db, "questions", id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Question;
}

/** Histórico de tentativas de um usuário para uma questão específica. */
export async function getAttemptsByQuestion(
  questionId: string,
  userId: string
): Promise<Attempt[]> {
  const q = query(
    collection(db, "attempts"),
    where("questionId", "==", questionId),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt));
}

/** Todas as tentativas de um usuário (usado no painel de desempenho). */
export async function getAttemptsByUser(userId: string): Promise<Attempt[]> {
  const q = query(collection(db, "attempts"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt));
}

/** Salva uma nova tentativa de resposta e retorna o id gerado. */
export async function saveAttempt(
  attempt: Omit<Attempt, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "attempts"), {
    ...attempt,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Atualiza o motivo do erro de uma tentativa já salva. */
export async function updateAttemptReason(
  attemptId: string,
  reason: ErrorReason
): Promise<void> {
  const ref = doc(db, "attempts", attemptId);
  await updateDoc(ref, { reason });
}

/** Marca/desmarca uma tentativa como favorita. */
export async function toggleFavorite(
  attemptId: string,
  isFavorite: boolean
): Promise<void> {
  const ref = doc(db, "attempts", attemptId);
  await updateDoc(ref, { isFavorite });
}