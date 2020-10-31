import { Schema, Layout, toBuffer } from './borsh'
import { PublicKey } from '@solana/web3.js'
import _ from 'lodash'

test('Enum serialize', () => {
  class Character extends Layout {
    static schema: Schema = new Map([
      [
        Character,
        {
          kind: 'enum',
          field: 'character',
          values: [
            ['Rick', 'string'],
            ['Spock', 'string'],
            ['Jabba', 'string'],
            ['Mando', 'string'],
            ['Empty', null],
          ],
        },
      ],
    ])
    constructor(prop: { character: string; [key: string]: string }) {
      super(Character.schema, prop)
    }
  }

  const ch1 = new Character({ character: 'Rick', Rick: 'Sanchez' })
  const out1 = ch1.encode()
  const expected1 = toBuffer(new Uint8Array([0, 7, 0, 0, 0, 83, 97, 110, 99, 104, 101, 122]))
  expect(out1.equals(expected1)).toBeTruthy()
  const decoded1 = Character.decode<Character>(Character.schema, Character, out1)
  expect(JSON.stringify(decoded1)).toEqual(JSON.stringify(_.omit(ch1, ['character'])))

  const ch2 = new Character({ character: 'Jabba', Jabba: 'Hutt' })
  const out2 = ch2.encode()
  const expected2 = toBuffer(new Uint8Array([2, 4, 0, 0, 0, 72, 117, 116, 116]))
  expect(out2.equals(expected2)).toBeTruthy()
  const decoded2 = Character.decode(Character.schema, Character, out2)
  expect(JSON.stringify(decoded2)).toEqual(JSON.stringify(_.omit(ch2, ['character'])))

  const ch3 = new Character({ character: 'Empty', Empty: null })
  const out3 = ch3.encode()
  expect(out3.equals(new Uint8Array([4]))).toBeTruthy()
})

test('Struct test', () => {
  class SpaceCat extends Layout {
    name: string
    addressPK: PublicKey

    static schema: Schema = new Map([
      [
        SpaceCat,
        {
          kind: 'struct',
          fields: [
            ['name', 'string'],
            ['addressPK', 'pk'],
          ],
        },
      ],
    ])

    constructor(prop: Omit<SpaceCat, 'encode'>) {
      super(SpaceCat.schema, prop)
    }
  }

  const pk = new PublicKey('BziyEanAxW3TyNDMXDHfX1SRZ9PaYUZqTyhdypwwpKis')
  // const felix = serialize(schema, new SpaceCat(schema,{ name: 'Félicette', addressPK: pk }))
  const felix = new SpaceCat({ name: 'Félicette', addressPK: pk })
  const expected = toBuffer(
    new Uint8Array([
      10,
      0,
      0,
      0,
      70,
      195,
      169,
      108,
      105,
      99,
      101,
      116,
      116,
      101,
      163,
      94,
      110,
      53,
      192,
      251,
      86,
      2,
      116,
      102,
      202,
      7,
      122,
      35,
      118,
      29,
      40,
      254,
      24,
      52,
      207,
      210,
      10,
      186,
      58,
      62,
      113,
      49,
      48,
      34,
      234,
      60,
    ]),
  )
  expect(felix.encode().equals(expected)).toBeTruthy()
  const decoded = SpaceCat.decode(SpaceCat.schema, SpaceCat, felix.encode())
  expect(felix).toEqual(decoded)
})

test('Option layout', () => {
  class Rocket extends Layout {
    location: string | null

    static schema: Schema = new Map([
      [
        Rocket,
        {
          kind: 'struct',
          fields: [['location', { kind: 'option', type: 'string' }]],
        },
      ],
    ])

    constructor(prop: Omit<Rocket, 'encode'>) {
      super(Rocket.schema, prop)
    }
  }
  const rocket = new Rocket({ location: null })
  expect(rocket.encode()).toEqual(toBuffer(new Uint8Array([0])))
})
