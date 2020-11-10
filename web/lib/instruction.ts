import { Layout, Schema } from './borsh'

export enum InstructionType {
  SetProfile = 'SetProfile',
  SendMessage = 'SendMessage',
}
export class Instruction extends Layout {
  constructor(prop: any) {
    const len = prop[prop['instruction']] != null ? prop[prop['instruction']].length : 0
    const schema: Schema = new Map([
      [
        Instruction,
        {
          kind: 'enum',
          field: 'instruction',
          values: [
            [InstructionType.SetProfile, [len]],
            [InstructionType.SendMessage, [len]],
          ],
        },
      ],
    ])
    super(schema)
    Layout.assign(this, prop)
  }
}

export class InstructionData extends Layout {
  static schema: Record<InstructionType, Schema> = {
    [InstructionType.SetProfile]: new Map([
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
    ]),
    [InstructionType.SendMessage]: new Map([
      [
        InstructionData,
        {
          kind: 'struct',
          fields: [
            ['kind', 'u8'],
            ['msg', ['u8']],
          ],
        },
      ],
    ]),
  }

  constructor(instructionType: InstructionType, prop: any) {
    super(InstructionData.schema[instructionType])
    Layout.assign(this, prop)
  }
}
