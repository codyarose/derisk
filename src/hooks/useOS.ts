import { ethers, Contract, Event } from "ethers";
import useProvider from "./useProvider";
import openseaABI from '../../openseaABI.json'
import { useEffect, useState } from "react";

const OPENSEA_CONTRACT_ADDRESS = '0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b'

export const useContract = async () => {
    const [events, setEvents] = useState<{from: Event[], to:Event[]}>({from: [], to: []})
  const provider = useProvider();
  const contract: Contract = new ethers.Contract(OPENSEA_CONTRACT_ADDRESS, openseaABI, provider);

  const fromEventFilter = contract.filters.OrdersMatched(null, null, "0xD4281868E1868840F0911d99DD5e387A46de5d8d")
  const toEventFilter = contract.filters.OrdersMatched(null, null, null, "0xD4281868E1868840F0911d99DD5e387A46de5d8d")

  useEffect(() => {
      async function fetchEvents() {
          const fromEvents = await contract.queryFilter(fromEventFilter)
          const toEvents = await contract.queryFilter(toEventFilter)
          setEvents({from: fromEvents, to: toEvents})
    }

    fetchEvents()
}, [])

  return events;
};

export default useContract;

// Try fetching transactions with creepz contract?
// or
// Try adding the creepz contract to the OS filter?

// fetch all wallet recent transactions
// click a transaction to load derisk analysis
// implement row virtualization, auto-fetch pagination


// floor analysis tool
// opensea sales
// scatterplot chart of sales and listings