import { useEffect, useState } from "react"

type Options = {
	onUpdate: () => void
}

export const useTxHash = () => {
	const search = window.location.search
	const params = new URLSearchParams(search)
	const hashFromURL = params.get("txHash")
	const [txHash, setTxHash] = useState("")

	useEffect(() => {
		if (hashFromURL) {
			setTxHash(hashFromURL)
		}
	}, [])

	const updateTxHash = (newTxHash: string, options?: Options) => {
		setTxHash((prevTxHash) => {
			if (prevTxHash === newTxHash) {
				return prevTxHash
			}

			if (options?.onUpdate) {
				options.onUpdate()
			}

			return newTxHash
		})

		params.set("txHash", newTxHash)
		history.pushState(null, "", "?" + params.toString())
	}

	return { txHash, updateTxHash }
}
