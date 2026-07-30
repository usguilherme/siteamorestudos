import { Attempt } from "@/types";

export function calculateAccuracy(attempts: Attempt[]): number {
  if (!attempts || attempts.length === 0) return 0;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  return Math.round((correctCount / attempts.length) * 100);
}

export function formatTime(totalSeconds: number | null | undefined): string {
  if (!totalSeconds) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function getUniqueQuestionsCount(attempts: Attempt[]): number {
  const uniqueIds = new Set(attempts.map(a => a.questionId));
  return uniqueIds.size;
}

export function exportLocalStorageData() {
  const data = {
    questions: JSON.parse(localStorage.getItem("estudos_amor_questions") || "[]"),
    history: JSON.parse(localStorage.getItem("estudos_amor_history") || "[]"),
    favorites: JSON.parse(localStorage.getItem("estudos_amor_favorites") || "[]"),
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `estudos_amor_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importLocalStorageData(event: React.ChangeEvent<HTMLInputElement>, onSuccess: () => void) {
  const fileReader = new FileReader();
  if (event.target.files && event.target.files[0]) {
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target?.result as string);
        if (parsedData.questions) {
          localStorage.setItem("estudos_amor_questions", JSON.stringify(parsedData.questions));
        }
        if (parsedData.history) {
          localStorage.setItem("estudos_amor_history", JSON.stringify(parsedData.history));
        }
        if (parsedData.favorites) {
          localStorage.setItem("estudos_amor_favorites", JSON.stringify(parsedData.favorites));
        }
        onSuccess();
      } catch (error) {
        console.error("Erro ao importar arquivo de backup JSON", error);
      }
    };
  }
}