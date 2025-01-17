import {Box, Heading, Text} from '@chakra-ui/layout'
import {Button} from '@chakra-ui/react'
import {useMutation} from '@redwoodjs/web'
import {useEthers} from '@usedapp/core'
import {useCallback} from 'react'
import {CreateConnectionMutation} from 'types/graphql'
import {load as loadIntendedConnection} from '../../lib/intendedConnectionStorage'
const CreateConnectionPage = () => {
  const {library: provider} = useEthers()
  //console.log('ethers result', result)

  const intendedConnection = loadIntendedConnection()
  //if (account == null) return <Redirect to={routes.createProfile()} />
  const [createConnection] = useMutation<CreateConnectionMutation>(gql`
    mutation CreateConnectionMutation($input: CreateConnectionInput!) {
      createConnection(input: $input) {
        purposeIdentifier
        externalAddress
      }
    }
  `)

  const connect = useCallback(async () => {
    console.log(provider, intendedConnection?.purposeIdentifier)
    if (provider == null || intendedConnection == null) return

    let signature = null

    try {
      // XXX: dedup message with backend
      const message = `Connect Zorro to ${intendedConnection?.externalAddress}`
      signature = await provider.getSigner().signMessage(message)
    } catch (error) {
      if (error.code === 4001) {
        // user denied signature
      } else {
        throw error
      }
    }

    console.log('signature', signature)

    await createConnection({
      variables: {
        input: {
          signature,
          purposeIdentifier: intendedConnection.purposeIdentifier,
          externalAddress: intendedConnection.externalAddress,
        },
      },
    })
  }, [provider, intendedConnection, createConnection])

  return (
    <Box maxW="xl" mx="auto">
      <Heading size="lg" pb="4">
        Connect
      </Heading>
      <Text>Intended connection: {JSON.stringify(intendedConnection)}</Text>
      {/* XXX: handle missing intended connection */}
      <Button onClick={connect} colorScheme="blue">
        Connect
      </Button>
    </Box>
  )
}

export default CreateConnectionPage
