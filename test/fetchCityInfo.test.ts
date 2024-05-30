
import { fetchCityInfo } from "../src/controllers/stateService";
import mysql from "mysql2/promise";

// Create an instance of the mock adapter
jest.mock('mysql2/promise');

describe('fetchCityInfo', () => {
  it('should fetch city info correctly', async () => {
    // 准备模拟数据
    const mockCities = [
      { id: 1, name: 'City1' },
      { id: 2, name: 'City2' },
    ];

    // 设置模拟的 MySQL 响应
    const executeMock = jest.fn().mockResolvedValue([mockCities]);
    const getConnectionMock = jest.fn().mockResolvedValue({
      execute: executeMock,
      release: jest.fn(),
    });
    (mysql.createPool as jest.Mock).mockReturnValue({
      getConnection: getConnectionMock,
    });

    // 创建模拟连接池
    const pool = mysql.createPool({});

    // 调用 fetchCityInfo 函数
    const result = await fetchCityInfo(pool);

    // 断言结果是否如预期
    expect(result).toEqual([
      { city_id: 1, name: 'City1' },
      { city_id: 2, name: 'City2' },
    ]);

    // 断言是否正确调用了数据库方法
    expect(getConnectionMock).toHaveBeenCalled();
    expect(executeMock).toHaveBeenCalledWith(`SELECT id,name FROM divisions`);
  });

  it("should handle errors and return an empty array", async () => {
    // 模拟数据库连接抛出错误
    const getConnectionMock = jest.fn().mockRejectedValue(new Error('Database connection failed'));
    (mysql.createPool as jest.Mock).mockReturnValue({
      getConnection: getConnectionMock,
    });

    // 创建模拟连接池
    const pool = mysql.createPool({});

    // 模拟 console.error 以便于断言
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 调用函数并断言结果
    const result = await fetchCityInfo(pool);
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith("fetch city info failed:", expect.any(Error));

    // 清理模拟
    consoleSpy.mockRestore();
  });
});
