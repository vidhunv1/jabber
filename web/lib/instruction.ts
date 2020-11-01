import { Layout, Schema } from './borsh'

export class Instruction extends Layout {
  constructor(prop: any) {
    const len = prop[prop['instruction']] != null ? prop[prop['instruction']].length : 0
    const schema: Schema = new Map([
      [
        Instruction,
        {
          kind: 'enum',
          field: 'instruction',
          values: [['SetUserProfile', [len]]],
        },
      ],
    ])
    super(schema, prop)
  }
}

export class InstructionData extends Layout {
  static schema: Schema = new Map([
    [
      InstructionData,
      {
        kind: 'struct',
        fields: [
          ['name', { kind: 'option', type: 'string' }],
          ['bio', { kind: 'option', type: 'string' }],
          ['lamportsPerMessage', { kind: 'option', type: 'u64' }],
        ],
      },
    ],
  ])

  constructor(prop: any) {
    super(InstructionData.schema, prop)
  }
}
