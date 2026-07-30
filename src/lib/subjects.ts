import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Subject, Topic } from "@/types";

export async function getSubjects(): Promise<Subject[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "subjects"));
    const subjects: Subject[] = [];
    querySnapshot.forEach((doc) => {
      subjects.push({ id: doc.id, ...doc.data() } as Subject);
    });
    return subjects;
  } catch (error) {
    console.error("Erro ao buscar matérias:", error);
    return [];
  }
}

export async function getTopicsBySubject(subjectId: string): Promise<Topic[]> {
  try {
    const q = query(collection(db, "topics"), where("subjectId", "==", subjectId));
    const querySnapshot = await getDocs(q);
    const topics: Topic[] = [];
    querySnapshot.forEach((doc) => {
      topics.push({ id: doc.id, ...doc.data() } as Topic);
    });
    return topics;
  } catch (error) {
    console.error("Erro ao buscar tópicos:", error);
    return [];
  }
}