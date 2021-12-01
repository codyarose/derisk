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
	Button,
	Input,
	InputGroup,
	InputRightAddon,
	useColorMode,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"

function App() {
	const [value, setValue] = useState(0)
	const [transactionFee, setTransactionFee] = useState(0)
	const [royalty, setroyalty] = useState(0)
	const [platformFee, setPlatformFee] = useState(2.5)
	const [deriskAmount, setDeriskAmount] = useState(0)
	const { colorMode, toggleColorMode } = useColorMode()

	useEffect(() => {
		if (value && transactionFee) {
			const totalCost = (value || 0) + (transactionFee || 0)
			const feesOffset = (100 - (platformFee + royalty)) / 100
			const finalAmount = Number((totalCost / feesOffset).toFixed(4))

			setDeriskAmount(finalAmount)
		}
	}, [value, transactionFee, royalty, platformFee])

	return (
		<Container h='100vh' display='flex' alignItems='center'>
			<Button
				onClick={toggleColorMode}
				pos='absolute'
				top={0}
				right={0}
				m={3}
			>
				{colorMode === "light" ? <MoonIcon /> : <SunIcon />}
			</Button>
			<Grid gridTemplateColumns={["1fr", "1fr 1fr"]} gridGap='6' w='100%'>
				<VStack align='flex-start'>
					<FormControl>
						<FormLabel>Value</FormLabel>
						<InputGroup>
							<Input
								type='number'
								name='value'
								min={0}
								onChange={(e) =>
									setValue(e.currentTarget.valueAsNumber)
								}
							/>
						</InputGroup>
					</FormControl>

					<FormControl>
						<FormLabel>Transaction Fee</FormLabel>
						<InputGroup>
							<Input
								type='number'
								name='transactionFee'
								min={0}
								onChange={(e) =>
									setTransactionFee(
										e.currentTarget.valueAsNumber
									)
								}
							/>
						</InputGroup>
					</FormControl>

					<FormControl>
						<FormLabel>Royalty</FormLabel>
						<InputGroup>
							<Input
								type='number'
								name='royalty'
								min={0}
								onChange={(e) =>
									setroyalty(e.currentTarget.valueAsNumber)
								}
							/>
							<InputRightAddon>%</InputRightAddon>
						</InputGroup>
					</FormControl>

					<FormControl>
						<FormLabel>Platform Fee</FormLabel>
						<InputGroup>
							<Input
								type='number'
								name='platformFee'
								defaultValue={platformFee}
								min={0}
								onChange={(e) =>
									setPlatformFee(
										e.currentTarget.valueAsNumber
									)
								}
							/>
							<InputRightAddon>%</InputRightAddon>
						</InputGroup>
					</FormControl>
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
