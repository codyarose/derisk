import { FormControl, FormLabel } from "@chakra-ui/form-control"
import { MoonIcon, SunIcon } from "@chakra-ui/icons"
import {
	Box,
	Container,
	Flex,
	Grid,
	Heading,
	VStack,
	Text,
} from "@chakra-ui/layout"
import {
	Alert,
	AlertIcon,
	Button,
	Fade,
	Input,
	InputGroup,
	Stat,
	StatGroup,
	StatLabel,
	StatNumber,
	useColorMode,
} from "@chakra-ui/react"
import { ChangeEvent, useState } from "react"
import { useQuery } from "react-query"
import { utils as ethersUtils, constants as ethersConstants } from "ethers"

const API_KEY = "FGTV43W5R7J9XW6JTITDED34FITIPDFB95"
const ETH_SYMBOL = ethersConstants.EtherSymbol

function App() {
	const { colorMode, toggleColorMode } = useColorMode()
	const [txHash, setTxHash] = useState("")

	const { data: txByHash, isLoading: isTxByHashLoading } = useQuery(
		["txByHash", txHash],
		() =>
			fetch(
				`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${API_KEY}`
			).then((res) => res.json()),
		{
			enabled: Boolean(txHash),
		}
	)

	const { data: txReceipt, isLoading: isTxReceiptLoading } = useQuery(
		["txReceipt", txHash],
		() =>
			fetch(
				`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${API_KEY}`
			).then((res) => res.json()),
		{
			enabled: Boolean(txHash),
		}
	)

	const contractAddress = txByHash?.result?.to ?? ""
	const { data: collectionData } = useQuery(
		["collection", contractAddress],
		() =>
			fetch(
				`https://api.opensea.io/api/v1/asset_contract/${contractAddress}`
			).then((res) => res.json()),
		{
			enabled: Boolean(contractAddress),
		}
	)

	const txValue = txByHash?.result
		? Number(ethersUtils.formatEther(txByHash.result.value))
		: 0
	const gasUsed = txReceipt?.result ? Number(txReceipt.result.gasUsed) : 0
	const gasPrice = txReceipt?.result
		? Number(ethersUtils.formatEther(txReceipt.result.effectiveGasPrice))
		: 0
	const txFee = gasUsed * gasPrice
	const collectionRoyalty =
		(collectionData?.dev_seller_fee_basis_points || 0) / 100
	const osFee = (collectionData?.opensea_seller_fee_basis_points || 0) / 100

	const deriskAmount = (
		(txValue + txFee) /
		((100 - (osFee + collectionRoyalty)) / 100)
	).toFixed(4)

	const handleTxSubmit = (e: ChangeEvent<HTMLFormElement>) => {
		e.preventDefault()

		setTxHash(
			(e.currentTarget.elements.namedItem("txHash") as HTMLInputElement)
				.value
		)
	}

	return (
		<Container
			display='flex'
			justifyContent='center'
			flexDir='column'
			py='10'
		>
			<Button
				onClick={toggleColorMode}
				pos='absolute'
				top={0}
				right={0}
				m={3}
			>
				{colorMode === "light" ? <MoonIcon /> : <SunIcon />}
			</Button>

			<Fade in={Boolean(txByHash?.error?.message.length)}>
				<Alert status='error' mb={3}>
					<AlertIcon />
					<Box>
						<Box>There was an error processing your request.</Box>
						Error: {txByHash?.error?.message}
					</Box>
				</Alert>
			</Fade>
			<Grid gridTemplateColumns={["1fr", "1fr 1fr"]} gridGap='6' w='100%'>
				<VStack align='flex-start'>
					<form onSubmit={handleTxSubmit}>
						<FormControl mb='3'>
							<FormLabel>Transaction hash</FormLabel>
							<InputGroup gridGap='1'>
								<Input
									name='txHash'
									maxLength={66}
									minLength={66}
								/>
								<Button
									type='submit'
									isLoading={
										isTxByHashLoading || isTxReceiptLoading
									}
								>
									Submit
								</Button>
							</InputGroup>
						</FormControl>
					</form>
					<StatGroup flexDir='column' gridGap='3'>
						<Stat>
							<StatLabel>Value</StatLabel>
							<StatNumber>
								{`${txValue} ${ETH_SYMBOL}`}
							</StatNumber>
						</Stat>
						<Stat>
							<StatLabel>Transaction fee</StatLabel>
							<StatNumber wordBreak='keep-all'>{`${txFee.toFixed(
								4
							)} ${ETH_SYMBOL}`}</StatNumber>
						</Stat>
						<Stat>
							<StatLabel>
								{`${collectionData?.name} `}Royalty
							</StatLabel>
							<StatNumber>{collectionRoyalty}%</StatNumber>
						</Stat>
						<Stat>
							<StatLabel>Platform fee</StatLabel>
							<StatNumber>{osFee}%</StatNumber>
						</Stat>
					</StatGroup>
				</VStack>
				<Flex
					justifyContent='center'
					gridRow={[1, null]}
					gridColumn={[null, 2]}
				>
					<Box>
						<Heading size='md'>Derisk amount:</Heading>
						<Heading size='xl'>{deriskAmount}</Heading>
						<Text fontSize='sm'>
							List for this amount to recoup purchase cost
							including fees
						</Text>
					</Box>
				</Flex>
			</Grid>
		</Container>
	)
}

export default App
