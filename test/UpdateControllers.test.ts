import { updatePayment } from '../src/controllers/updateController';
import { Request, Response } from 'express';
import { Pool ,createPool} from 'mysql2/promise';

// 模擬mysql2池
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn().mockImplementation(() => ({
    getConnection: jest.fn().mockResolvedValue({
      execute: jest.fn().mockResolvedValue([{}]),
      release: jest.fn(),
    }),
  })),
}));

describe('updatePayment', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockPool: Partial<Pool>;

  beforeEach(() => {
    mockRequest = {
      body: {
        code: '23010101',
        method: 'credit',
        paid: 100,
        payed_off: true,
        payment_date: new Date(),
        total: 200,
        unpaid: 100,
        scheduled_payment_date: new Date(),
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockPool = createPool('mysql://user:pass@host/db');    });

  it('should update payment details and return success response', async () => {
    await updatePayment(mockRequest as Request, mockResponse as Response, mockPool as Pool);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
    }));
  });

  // 錯誤處理
  it('should handle errors and return failure response', async () => {
    const errorMessage = { message: '错误' };
    (mockPool.getConnection as jest.Mock).mockRejectedValueOnce(errorMessage);

    await updatePayment(mockRequest as Request, mockResponse as Response, mockPool as Pool);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "支付更新失敗。",
      error: errorMessage,
    }));
  });
});

