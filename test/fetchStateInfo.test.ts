import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { fetchStateInfo } from '../src/controllers/stateService';  

// Create an instance of the mock adapter
const mock = new MockAdapter(axios);

describe('fetchStateInfo', () => {
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    // Mock console.error before each test
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Reset all instance handlers of mock adapter after each test
    mock.reset();
    // Restore console.error after each test
    mockConsoleError.mockRestore();
  });

  it('should fetch state info and return the data', async () => {
    // Mock the axios request
    const mockData = [{ id: 1, name: 'State 1' }, { id: 2, name: 'State 2' }];
    mock.onGet().reply(200, mockData);

    // Call the function and assert the result
    const result = await fetchStateInfo();
    expect(result).toEqual(mockData);
  });

  it('should handle errors and return an empty array', async () => {
    // Mock the axios request to fail
    mock.onGet().reply(500);

    // Call the function and assert the result
    const result = await fetchStateInfo();
    expect(result).toEqual([]);
    expect(mockConsoleError).toHaveBeenCalledWith('fetch state info failed:', expect.any(Error));
  });
});
