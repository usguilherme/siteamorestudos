import { collection, getDocs, getDoc, doc, query, where } from "firebase/firestore";
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

export async function getSubjectById(id: string): Promise<Subject | null> {
  try {
    const docRef = doc(db, "subjects", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Subject;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar matéria por ID:", error);
    return null;
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

export async function getTopicById(subjectId: string, topicId: string): Promise<Topic | null> {
  try {
    const docRef = doc(db, "topics", topicId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Topic;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar tópico por ID:", error);
    return null;
  }
}