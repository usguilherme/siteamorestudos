import {
  calculateAccuracy,
  formatTime,
  getUniqueQuestionsCount,
  exportLocalStorageData,
} from "./utils";
import { Attempt } from "@/types";

describe("Utils - Funções de Utilidade", () => {
  describe("calculateAccuracy", () => {
    it("deve retornar 0 para uma lista de tentativas vazia ou nula", () => {
      expect(calculateAccuracy([])).toBe(0);
      expect(calculateAccuracy(null as unknown as Attempt[])).toBe(0);
    });

    it("deve calcular a porcentagem de acertos corretamente", () => {
      const attempts: Attempt[] = [
        { questionId: "1", isCorrect: true },
        { questionId: "2", isCorrect: false },
        { questionId: "3", isCorrect: true },
        { questionId: "4", isCorrect: true },
      ] as Attempt[];

      // 3 acertos em 4 tentativas = 75%
      expect(calculateAccuracy(attempts)).toBe(75);
    });

    it("deve arredondar o resultado para o número inteiro mais próximo", () => {
      const attempts: Attempt[] = [
        { questionId: "1", isCorrect: true },
        { questionId: "2", isCorrect: false },
        { questionId: "3", isCorrect: false },
      ] as Attempt[];

      // 1 acerto em 3 tentativas = 33.333...% -> 33%
      expect(calculateAccuracy(attempts)).toBe(33);
    });
  });

  describe("formatTime", () => {
    it("deve retornar '00:00' se o tempo for nulo, indefinido ou 0", () => {
      expect(formatTime(null)).toBe("00:00");
      expect(formatTime(undefined)).toBe("00:00");
      expect(formatTime(0)).toBe("00:00");
    });

    it("deve formatar os segundos com pad de zero à esquerda", () => {
      expect(formatTime(5)).toBe("00:05");
      expect(formatTime(65)).toBe("01:05");
      expect(formatTime(600)).toBe("10:00");
      expect(formatTime(3599)).toBe("59:59");
    });
  });

  describe("getUniqueQuestionsCount", () => {
    it("deve contar corretamente o número de questões únicas respondidas", () => {
      const attempts: Attempt[] = [
        { questionId: "q1", isCorrect: true },
        { questionId: "q2", isCorrect: false },
        { questionId: "q1", isCorrect: false }, // duplicada
        { questionId: "q3", isCorrect: true },
      ] as Attempt[];

      expect(getUniqueQuestionsCount(attempts)).toBe(3);
    });

    it("deve retornar 0 para uma lista vazia", () => {
      expect(getUniqueQuestionsCount([])).toBe(0);
    });
  });

  describe("exportLocalStorageData", () => {
    beforeEach(() => {
      localStorage.clear();
      jest.clearAllMocks();
    });

    it("deve extrair dados do localStorage e acionar o download do arquivo JSON", () => {
      const sampleQuestions = [{ id: "1", statement: "Questão Teste" }];
      localStorage.setItem("estudos_amor_questions", JSON.stringify(sampleQuestions));

      // Mock da criação de elemento no DOM e ação de clique
      const mockClick = jest.fn();
      const mockAnchor = {
        setAttribute: jest.fn(),
        click: mockClick,
        remove: jest.fn(),
      };

      jest.spyOn(document, "createElement").mockReturnValue(mockAnchor as unknown as HTMLElement);
      jest.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as unknown as HTMLElement);

      exportLocalStorageData();

      expect(document.createElement).toHaveBeenCalledWith("a");
      expect(mockAnchor.setAttribute).toHaveBeenCalledWith("download", expect.stringMatching(/^estudos_amor_backup_.*\.json$/));
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.remove).toHaveBeenCalled();
    });
  });
});