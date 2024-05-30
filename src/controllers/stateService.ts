import axios from "axios";
// import { Request, Response } from "express";
import mysql,{RowDataPacket} from "mysql2/promise";
import { pool } from "../pool";
  
// import NodeCache from "node-cache";
// const limit = 10000;
// const offset = 0;
// const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });


interface CityInfo {
  city_id: number;
  name: string;
}
interface StateInfo {
  id: number;
  name: string;
}
// ----------------------------------------------------------------

export const fetchCityInfo = async (pool:mysql.Pool): Promise<CityInfo[]> => {
  const cityInfo: CityInfo[] = [];
  try {
    const query = `SELECT id,name FROM divisions`;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(query);
    connection.release();
    const rowDataPackets = rows as RowDataPacket[];
    for (let i = 0; i < rowDataPackets.length; i++) {
      cityInfo.push({
        city_id: rowDataPackets[i].id,
        name: rowDataPackets[i].name,
      });
    }
    return cityInfo;
  } catch (error) {
    console.error("fetch city info failed:", error);
    return [];
  }
};
export const fetchStateInfo = async (): Promise<StateInfo[]> => {
  const stateInfo: StateInfo[] = [];
  try {
    const { data } = await axios.get("http://ods.dtstw.com/backend/api/localization/division/state");
    stateInfo.push(...data);
    return stateInfo;
  } catch (error) {
    console.error("fetch state info failed:", error);
    return [];
  }
};

(async () => {
  const fetchedCityInfo = await fetchCityInfo(pool);
  const fetchedStateInfo = await fetchStateInfo();
  const cityIdToNameMap: { [key: string]: string } = {};
  const stateIdToNameMap: { [key: string]: string } = {};
  for (const city of fetchedCityInfo) {
    cityIdToNameMap[String(city.city_id)] = city.name;
  }
  for (const state of fetchedStateInfo) {
    stateIdToNameMap[String(state.id)] = state.name;
  }
})();
