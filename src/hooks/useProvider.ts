import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
const ETH_NETWORK_URL = 'https://eth-mainnet.alchemyapi.io/v2/t9ec-Be9bd9ASm2K_BfvhGlEDoE1Y5TM'

const useProvider = () => {
    return new ethers.providers.JsonRpcProvider(ETH_NETWORK_URL);
};

export default useProvider;