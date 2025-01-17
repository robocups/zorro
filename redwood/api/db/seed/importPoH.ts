import type {CachedProfile} from '@prisma/client'
import fs from 'fs'
import {gql, request} from 'graphql-request'
import fetch from 'node-fetch'
import path from 'path'
import rwc from 'random-weighted-choice'

const query = gql`
  query PoHIndexQuery($skip: Int = 0, $first: Int = 1000) {
    submissions(
      orderBy: creationTime
      orderDirection: desc
      skip: $skip
      first: $first
    ) {
      id
      status
      registered
      submissionTime
      name
      disputed
      requests(
        orderBy: creationTime
        orderDirection: desc
        first: 1
        where: {registration: true}
      ) {
        evidence(orderBy: creationTime, first: 1) {
          URI
        }
      }
    }
  }
`

// get the current file's directory
// const directory =
const CACHE_FILE = path.join(__dirname, 'POHUsers.json')

export default async function importPoH(): Promise<Partial<CachedProfile>[]> {
  if (!fs.existsSync(CACHE_FILE)) {
    const data = await request(
      'https://gateway.thegraph.com/api/d98c97feb09f87d2d86956a815a5dbb5/subgraphs/id/0xb2a33ae0e07fd2ca8dbde9545f6ce0b3234dc4e8-0',
      query
    )

    for (const profile of data.submissions) {
      const address = profile.id
      const regCid = profile.requests[0].evidence[0].URI.split('/')[2]
      const regJSON = await (
        await fetch(`https://ipfs.kleros.io/ipfs/${regCid}/registration.json`)
      ).json()
      const fileCid = regJSON.fileURI.split('/')[2]
      const fileJSON = await (
        await fetch(`https://ipfs.kleros.io/ipfs/${fileCid}/file.json`)
      ).json()

      const status = rwc([
        {id: 'submitted_via_notary', weight: 10},
        {id: 'challenged', weight: 2},
        {id: 'deemed_valid', weight: 1},
        {id: 'deemed_invalid', weight: 1},
      ])

      const normalizedProfile = {
        address,
        status,
        cid: fileCid,
        photoCid: fileJSON.photo.replace('/ipfs/', ''),
        videoCid: fileJSON.video.replace('/ipfs/', ''),
      }
      fs.appendFileSync(CACHE_FILE, JSON.stringify(normalizedProfile) + '\n')
    }
  }

  return fs
    .readFileSync(CACHE_FILE, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line))
}
