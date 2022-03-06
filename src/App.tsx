import { ChangeEvent, useEffect, useState } from "react"
import { useQuery } from "react-query"
import { utils as ethersUtils, constants as ethersConstants } from "ethers"
import { FormControl } from "@chakra-ui/form-control"
import { MoonIcon, SunIcon } from "@chakra-ui/icons"
import {
	Box,
	Container,
	Flex,
	Grid,
	Heading,
	VStack,
	Text,
	Link,
	Divider,
} from "@chakra-ui/layout"
import {
	Button,
	createStandaloneToast,
	Input,
	InputGroup,
	Stat,
	StatGroup,
	StatLabel,
	StatNumber,
	useColorMode,
	Image,
	InputRightAddon,
	Fade,
} from "@chakra-ui/react"
import { useTxHash } from "./hooks/useTxHash"
// import useProvider from "./hooks/useProvider"
import useContract from "./hooks/useOS"

const API_KEY = "FGTV43W5R7J9XW6JTITDED34FITIPDFB95"
const ETH_SYMBOL = ethersConstants.EtherSymbol

function App() {
	const { colorMode, toggleColorMode } = useColorMode()
	const toast = createStandaloneToast()
	const { txHash, updateTxHash } = useTxHash()
	const [profit, setProfit] = useState(0)
	const [isUnknownContract, setIsUnknownContract] = useState(false)

	// const provider = useProvider()
	// console.log({provider})
	
	const events = useContract()
	// console.log(events ? events.then(data => data && data[0].getTransactionReceipt()) : null)
	console.log(events)


	const { data: txByHash, isLoading: isLoadingTxByHash } = useQuery(
		["txByHash", txHash],
		() =>
			fetch(
				`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${API_KEY}`
			).then((res) => res.json()),
		{
			enabled: Boolean(txHash),
		}
	)

	const { data: txReceipt, isLoading: isLoadingTxReceipt } = useQuery(
		["txReceipt", txHash],
		() =>
			fetch(
				`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${API_KEY}`
			).then((res) => res.json()),
		{
			enabled: Boolean(txHash),
		}
	)

	// In the logs array the item with `data: "0x"` appears to contain the original collection's contract address
	const contractAddress = txReceipt?.result?.logs.find(
		(item: any) => item.data === "0x"
	)?.address

	const { data: collectionData } = useQuery<CollectionData>(
		["collection", contractAddress],
		() =>
			fetch(
				`https://api.opensea.io/api/v1/asset_contract/${contractAddress}`
			).then((res) => res.json()),
		{
			enabled: Boolean(contractAddress),
			onSuccess: (data) => {
				if (data.asset_contract_type === "unknown") {
					setIsUnknownContract(true)
				} else {
					setIsUnknownContract(false)
				}
			},
		}
	)

	const {
		data: collectionStats,
		isRefetching: isRefetchingCollectionStats,
		refetch: refetchCollectionStats,
	} = useQuery<{ stats: CollectionStats }>(
		["stats", collectionData?.collection?.slug],
		() =>
			fetch(
				`https://api.opensea.io/api/v1/collection/${collectionData?.collection?.slug}/stats`
			).then((res) => res.json()),
		{
			enabled: Boolean(collectionData),
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

		const newTxHash = (
			e.currentTarget.elements.namedItem("txHash") as HTMLInputElement
		).value

		updateTxHash(newTxHash, {
			onUpdate: () => {
				setProfit(0)
			},
		})

		e.currentTarget.focus()
	}

	const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
		e.currentTarget.select()
	}

	const handleCollectionStatsRefetch = () => {
		refetchCollectionStats()
	}

	const handleSalePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { valueAsNumber } = e.currentTarget
		const saleFee = valueAsNumber * ((osFee + collectionRoyalty) / 100)
		const newProfit = valueAsNumber - saleFee - (txValue + txFee)

		setProfit(Number(newProfit.toFixed(4)))
	}

	useEffect(() => {
		if (txByHash?.error?.message.length) {
			console.log(txByHash.error)
			toast({
				title: "An error occurred.",
				description: txByHash.error.message,
				status: "error",
				duration: 9000,
				isClosable: true,
			})
		}
	}, [txByHash?.error?.message])

	return (
		<Container
			display='flex'
			justifyContent='center'
			flexDir='column'
			py={["1rem", "3rem"]}
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

			<Box as='header' mb={5}>
				<Heading>derisk.tools</Heading>
			</Box>

			<form onSubmit={handleTxSubmit}>
				<FormControl mb='3'>
					<InputGroup gridGap='1'>
						<Input
							name='txHash'
							maxLength={66}
							autoFocus
							onClick={handleInputClick}
							defaultValue={txHash}
							placeholder='Transaction hash, ex: 0x1234...'
						/>
						<Button
							type='submit'
							isLoading={isLoadingTxByHash || isLoadingTxReceipt}
						>
							Submit
						</Button>
					</InputGroup>
				</FormControl>
			</form>

			{txByHash?.result && txReceipt?.result ? (
				<Grid
					gridTemplateColumns={["1fr", "1fr 1fr"]}
					gridGap='6'
					w='100%'
					my={5}
				>
					<VStack align='flex-start'>
						<Heading size='md'>Transaction details:</Heading>
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
							<Fade in={Boolean(collectionData)}>
								<Stat>
									<StatLabel>
										{`${collectionData?.name} `}
										Royalty
									</StatLabel>
									<StatNumber>
										{isUnknownContract
											? "--"
											: `${collectionRoyalty}%`}
									</StatNumber>
								</Stat>
								<Stat>
									<StatLabel>Platform fee</StatLabel>
									<StatNumber>
										{isUnknownContract ? "--" : `${osFee}%`}
									</StatNumber>
								</Stat>
							</Fade>
						</StatGroup>
					</VStack>
					<Flex
						flexDir='column'
						gridRow={[1, null]}
						gridColumn={[null, 2]}
						pb={[5, null]}
						borderBottom={["1px solid gray", "none"]}
					>
						<Box mb={4}>
							<Heading size='md'>Derisk amount:</Heading>
							<Heading size='xl'>
								{`${deriskAmount} ${ETH_SYMBOL}`}
							</Heading>
							<Text fontSize='sm'>
								List for this amount to recoup purchase cost
								including fees
							</Text>
						</Box>

						<Fade in={Boolean(collectionData)}>
							<Box>
								<Text mb={1}>If you sold for</Text>
								<InputGroup size='sm'>
									<Input
										name='salePrice'
										type='number'
										onChange={handleSalePriceChange}
										placeholder='sale price'
										mb={1}
									/>
									<InputRightAddon title='eth'>
										{ETH_SYMBOL}
									</InputRightAddon>
								</InputGroup>
								<Text>your total profit would be</Text>
								<Heading size='md'>{`${
									profit || 0
								} ${ETH_SYMBOL}`}</Heading>
							</Box>
						</Fade>
					</Flex>
				</Grid>
			) : (
				<Flex justifyContent='center' py={5} textAlign='center'>
					<Text fontSize='lg' maxW={400}>
						Enter a transaction hash/id above to view the
						transaction details and derisk amount.
					</Text>
				</Flex>
			)}

			{collectionData?.collection && collectionStats ? (
				<Fade in={Boolean(collectionStats)}>
					<Divider />
					<Box mt={5}>
						<Flex
							justifyContent='space-between'
							alignItems='center'
							mb={3}
						>
							<Link
								href={`https://opensea.io/collection/${collectionData?.collection?.slug}`}
								isExternal
								_focus={{ outline: "none" }}
							>
								<Flex gridGap={3} alignItems='center'>
									{collectionData?.collection?.image_url ? (
										<Image
											src={
												collectionData?.collection
													.image_url
											}
											boxSize='40px'
											objectFit='cover'
											borderRadius='full'
										/>
									) : null}
									<Heading size='md'>
										{collectionData?.name} Stats
									</Heading>
								</Flex>
							</Link>
							<Button
								onClick={handleCollectionStatsRefetch}
								isLoading={isRefetchingCollectionStats}
							>
								&#8635;
							</Button>
						</Flex>
						<StatGroup gridGap={3}>
							<Stat>
								<StatLabel>Items</StatLabel>
								<StatNumber>
									{collectionStats?.stats.count}
								</StatNumber>
							</Stat>
							<Stat>
								<StatLabel>Floor</StatLabel>
								<StatNumber>
									{`${Number(
										collectionStats?.stats?.floor_price?.toFixed(
											4
										)
									)} ${ETH_SYMBOL}`}
								</StatNumber>
							</Stat>
							<Stat>
								<StatLabel>Volume traded</StatLabel>
								<StatNumber>
									{`${Math.trunc(
										collectionStats?.stats.total_volume || 0
									)} ${ETH_SYMBOL}`}
								</StatNumber>
							</Stat>
						</StatGroup>
					</Box>
				</Fade>
			) : null}
		</Container>
	)
}

export default App

type CollectionData = {
	name: string
	dev_seller_fee_basis_points: number
	opensea_seller_fee_basis_points: number
	asset_contract_type: string | "unknown"
	collection: {
		image_url: string
		slug: string
	}
}

type CollectionStats = {
	count: number
	floor_price: number
	total_volume: number
}

// fetch all nfts from address
// select nft to get all transactions to/from contract address
// also manual contract address input

// fetch all erc721 transfers from address
// https://api.etherscan.io/api?module=account&action=tokennfttx&address=0xD4281868E1868840F0911d99DD5e387A46de5d8d&page=1&offset=1000&startblock=0&endblock=27025780&sort=asc&apikey=FGTV43W5R7J9XW6JTITDED34FITIPDFB95
// filter duplicate items 
// display in list of items
// select item
// loop over all transactions matching item's contract address to fetch based on hash
// tally up inflows/outflows
// display