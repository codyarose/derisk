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
} from "@chakra-ui/react"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import { useQuery } from "react-query"
import { utils as ethersUtils, constants as ethersConstants } from "ethers"

const API_KEY = "FGTV43W5R7J9XW6JTITDED34FITIPDFB95"
const ETH_SYMBOL = ethersConstants.EtherSymbol

function App() {
	const { colorMode, toggleColorMode } = useColorMode()
	const toast = createStandaloneToast()
	const [txHash, setTxHash] = useState("")
	const inputRef = useRef<HTMLInputElement | null>(null)

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
	const contractAddress = txReceipt?.result.logs.find(
		(item: any) => item.data === "0x"
	).address

	const { data: collectionData } = useQuery<CollectionData>(
		["collection", contractAddress],
		() =>
			fetch(
				`https://api.opensea.io/api/v1/asset_contract/${contractAddress}`
			).then((res) => res.json()),
		{
			enabled: Boolean(contractAddress),
		}
	)

	const {
		data: collectionStats,
		isRefetching: isRefetchingCollectionStats,
		refetch: refetchCollectionStats,
	} = useQuery<{ stats: CollectionStats }>(
		["stats", collectionData?.collection.slug],
		() =>
			fetch(
				`https://api.opensea.io/api/v1/collection/${collectionData?.collection.slug}/stats`
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

		setTxHash(
			(e.currentTarget.elements.namedItem("txHash") as HTMLInputElement)
				.value
		)

		inputRef.current?.focus()
	}

	const handleInputClick = () => {
		inputRef.current?.select()
	}

	const handleCollectionStatsRefetch = () => {
		refetchCollectionStats()
	}

	useEffect(() => {
		if (txByHash?.error?.message.length) {
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
					<FormLabel>Transaction hash</FormLabel>
					<InputGroup gridGap='1'>
						<Input
							name='txHash'
							maxLength={66}
							autoFocus
							ref={inputRef}
							onClick={handleInputClick}
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
			<Grid
				gridTemplateColumns={["1fr", "1fr 1fr"]}
				gridGap='6'
				w='100%'
				mb={5}
			>
				<VStack align='flex-start'>
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
						<Heading size='xl'>
							{`${deriskAmount} ${ETH_SYMBOL}`}
						</Heading>
						<Text fontSize='sm'>
							List for this amount to recoup purchase cost
							including fees
						</Text>
					</Box>
				</Flex>
			</Grid>

			{collectionStats ? (
				<>
					<Divider />
					<Box mt={5}>
						<Link
							href={`https://opensea.io/collection/${collectionData?.collection.slug}`}
							isExternal
							_focus={{ outline: "none" }}
						>
							<Flex gridGap={3} mb={3} alignItems='flex-end'>
								<Image
									src={collectionData?.collection.image_url}
									boxSize='40px'
									objectFit='cover'
									borderRadius='full'
								/>
								<Heading size='lg'>
									{collectionData?.name} Stats
								</Heading>
							</Flex>
						</Link>
						<StatGroup>
							<Stat>
								<StatLabel>Items</StatLabel>
								<StatNumber>
									{collectionStats.stats.count}
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
										collectionStats.stats.total_volume
									)} ${ETH_SYMBOL}`}
								</StatNumber>
							</Stat>
							<Button
								onClick={handleCollectionStatsRefetch}
								isLoading={isRefetchingCollectionStats}
							>
								&#8635;
							</Button>
						</StatGroup>
					</Box>
				</>
			) : null}
		</Container>
	)
}

export default App

type CollectionData = {
	name: string
	dev_seller_fee_basis_points: number
	opensea_seller_fee_basis_points: number
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
