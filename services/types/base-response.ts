/**
 * Базовый интерфейс для всех API ответов
 */
export interface BaseResponse {
    /** Статус ответа: 'ok' или 'error' */
    status: 'ok' | 'error';
    
    /** Код статуса HTTP или внутренний код ошибки/успеха */
    code?: number;
    
    /** Сообщение от API, обычно содержит описание ошибки */
    message?: string;
  }