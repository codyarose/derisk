import { FormControl, FormLabel } from "@chakra-ui/form-control"
import { Box, Container, Flex, Grid, Heading, VStack } from "@chakra-ui/layout"
import { Input, InputGroup, InputRightAddon } from "@chakra-ui/react"
import { useEffect, useState } from "react"

function App() {
	const [value, setValue] = useState(0)
	const [transactionFee, setTransactionFee] = useState(0)
	const [royalties, setRoyalties] = useState(0)
	const [platformFee, setPlatformFee] = useState(2.5)
	const [deriskAmount, setDeriskAmount] = useState(0)

	useEffect(() => {
		if (value && transactionFee) {
			const totalCost = value + transactionFee
			const totalFees = ((platformFee + royalties) / 100) * totalCost
			const finalAmount = Number((totalCost + totalFees).toFixed(4))
			setDeriskAmount(finalAmount || 0)
		}
	}, [value, transactionFee, royalties, platformFee])

	return (
		<Container h='100vh' display='flex' alignItems='center'>
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
						<FormLabel>Royalties</FormLabel>
						<InputGroup>
							<Input
								type='number'
								name='royalties'
								min={0}
								onChange={(e) =>
									setRoyalties(e.currentTarget.valueAsNumber)
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
					</Box>
				</Flex>
			</Grid>
		</Container>
	)
}

export default App
