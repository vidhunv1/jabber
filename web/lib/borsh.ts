import BN from 'bn.js'
import { PublicKey } from '@solana/web3.js'

const textDecoder = new TextDecoder('utf-8', { fatal: true })

const INITIAL_LENGTH = 1024
const PK_BYTES = 32 // the length of the public key

type BaseFields = 'u8' | 'u16' | 'u32' | 'u64' | 'string' | 'pk'
type FieldType = BaseFields | [number] | [BaseFields]
export interface StructSchema {
  kind: 'struct'
  fields: [string, FieldType | { kind: 'option'; type: FieldType }][]
}
export interface EnumSchema {
  kind: 'enum'
  field: string
  values: [string, FieldType | { kind: 'option'; type: FieldType }][]
}
export type Schema = Map<any, StructSchema | EnumSchema>

export class BorshError extends Error {
  originalMessage: string
  fieldPath: string[] = []

  constructor(message: string) {
    super(message)
    this.originalMessage = message
  }

  addToFieldPath(fieldName: string) {
    this.fieldPath.splice(0, 0, fieldName)
    // NOTE: Modifying message directly as jest doesn't use .toString()
    this.message = this.originalMessage + ': ' + this.fieldPath.join('.')
  }
}

/// Binary encoder.
export class BinaryWriter {
  buf: Buffer
  length: number

  public constructor() {
    this.buf = Buffer.alloc(INITIAL_LENGTH)
    this.length = 0
  }

  maybe_resize() {
    if (this.buf.length < 16 + this.length) {
      this.buf = Buffer.concat([this.buf, Buffer.alloc(INITIAL_LENGTH)])
    }
  }

  public write_u8(value: number) {
    this.maybe_resize()
    this.buf.writeUInt8(value, this.length)
    this.length += 1
  }

  public write_u16(value: number) {
    this.maybe_resize()
    this.buf.writeUInt16LE(value, this.length)
    this.length += 4
  }

  public write_u32(value: number) {
    this.maybe_resize()
    this.buf.writeUInt32LE(value, this.length)
    this.length += 4
  }

  public write_u64(value: BN) {
    this.maybe_resize()
    this.write_buffer(Buffer.from(new BN(value).toArray('le', 8)))
  }

  public write_u128(value: BN) {
    this.maybe_resize()
    this.write_buffer(Buffer.from(new BN(value).toArray('le', 16)))
  }

  private write_buffer(buffer: Buffer) {
    // Buffer.from is needed as this.buf.subarray can return plain Uint8Array in browser
    this.buf = Buffer.concat([Buffer.from(this.buf.subarray(0, this.length)), buffer, Buffer.alloc(INITIAL_LENGTH)])
    this.length += buffer.length
  }

  public write_string(str: string) {
    this.maybe_resize()
    const b = Buffer.from(str, 'utf8')
    this.write_u32(b.length)
    this.write_buffer(b)
  }

  public write_pk(pk: PublicKey) {
    const buf = pk.toBuffer()
    if (buf.length !== PK_BYTES) {
      throw new BorshError('Public key length should be 32 bytes.')
    }
    this.write_buffer(buf)
  }

  public write_fixed_array(array: Uint8Array) {
    this.write_buffer(Buffer.from(array))
  }

  public write_array(array: any[], fn: any) {
    this.maybe_resize()
    this.write_u32(array.length)
    for (const elem of array) {
      this.maybe_resize()
      fn(elem)
    }
  }

  public toArray(): Buffer {
    return this.buf.subarray(0, this.length)
  }
}

function handlingRangeError(_target: any, _propertyKey: string, propertyDescriptor: PropertyDescriptor) {
  const originalMethod = propertyDescriptor.value
  propertyDescriptor.value = function (...args: any[]) {
    try {
      return originalMethod.apply(this, args)
    } catch (e) {
      if (e instanceof RangeError) {
        const code = (e as any).code
        if (['ERR_BUFFER_OUT_OF_BOUNDS', 'ERR_OUT_OF_RANGE'].indexOf(code) >= 0) {
          throw new BorshError('Reached the end of buffer when deserializing')
        }
      }
      throw e
    }
  }
}

export class BinaryReader {
  buf: Buffer
  offset: number

  public constructor(buf: Buffer) {
    this.buf = buf
    this.offset = 0
  }

  @handlingRangeError
  read_u8(): number {
    const value = this.buf.readUInt8(this.offset)
    this.offset += 1
    return value
  }

  @handlingRangeError
  read_u16(): number {
    const value = this.buf.readUInt16LE(this.offset)
    this.offset += 2
    return value
  }

  @handlingRangeError
  read_u32(): number {
    const value = this.buf.readUInt32LE(this.offset)
    this.offset += 4
    return value
  }

  @handlingRangeError
  read_u64(): BN {
    const buf = this.read_buffer(8)
    return new BN(buf, 'le')
  }

  @handlingRangeError
  read_u128(): BN {
    const buf = this.read_buffer(16)
    return new BN(buf, 'le')
  }

  private read_buffer(len: number): Buffer {
    if (this.offset + len > this.buf.length) {
      throw new BorshError(`Expected buffer length ${len} isn't within bounds`)
    }
    const result = this.buf.slice(this.offset, this.offset + len)
    this.offset += len
    return result
  }

  @handlingRangeError
  read_string(): string {
    const len = this.read_u32()
    const buf = this.read_buffer(len)
    try {
      // NOTE: Using TextDecoder to fail on invalid UTF-8
      return textDecoder.decode(buf)
    } catch (e) {
      throw new BorshError(`Error decoding UTF-8 string: ${e}`)
    }
  }

  @handlingRangeError
  read_pk(): PublicKey {
    const buf = this.read_buffer(PK_BYTES)
    try {
      return new PublicKey(buf)
    } catch (e) {
      throw new BorshError(`Error decoding public key`)
    }
  }

  @handlingRangeError
  read_fixed_array(len: number): Uint8Array {
    return new Uint8Array(this.read_buffer(len))
  }

  @handlingRangeError
  read_array(fn: any): any[] {
    const len = this.read_u32()
    const result = Array<any>()
    for (let i = 0; i < len; ++i) {
      result.push(fn())
    }
    return result
  }
}

function serializeField(schema: Schema, fieldName: string, value: any, fieldType: any, writer: any) {
  try {
    // TODO: Handle missing values properly (make sure they never result in just skipped write)
    if (typeof fieldType === 'string') {
      writer[`write_${fieldType}`](value)
    } else if (fieldType instanceof Array) {
      if (typeof fieldType[0] === 'number') {
        if (value.length !== fieldType[0]) {
          throw new BorshError(`Expecting byte array of length ${fieldType[0]}, but got ${value.length} bytes`)
        }
        writer.write_fixed_array(value)
      } else {
        writer.write_array(value, (item: any) => {
          serializeField(schema, fieldName, item, fieldType[0], writer)
        })
      }
    } else if (fieldType && fieldType.kind !== undefined) {
      switch (fieldType.kind) {
        case 'option': {
          if (value === null) {
            writer.write_u8(0)
          } else {
            writer.write_u8(1)
            serializeField(schema, fieldName, value, fieldType.type, writer)
          }
          break
        }
        default:
          throw new BorshError(`FieldType ${fieldType} unrecognized`)
      }
    } else if (fieldType == null) {
      // Empty field, for Enum's
    } else {
      serializeStruct(schema, value, writer)
    }
  } catch (error) {
    if (error instanceof BorshError) {
      error.addToFieldPath(fieldName)
    }
    throw error
  }
}

function serializeStruct(schema: Schema, obj: any, writer: any) {
  const structSchema = schema.get(obj.constructor)
  if (!structSchema) {
    throw new BorshError(`Class ${obj.constructor.name} is missing in schema`)
  }
  if (structSchema.kind === 'struct') {
    structSchema.fields.map(([fieldName, fieldType]: [any, any]) => {
      serializeField(schema, fieldName, obj[fieldName], fieldType, writer)
    })
  } else if (structSchema.kind === 'enum') {
    const name = obj[structSchema.field]
    for (let idx = 0; idx < structSchema.values.length; ++idx) {
      const [fieldName, fieldType]: [any, any] = structSchema.values[idx]
      if (fieldName === name) {
        writer.write_u8(idx)
        serializeField(schema, fieldName, obj[fieldName], fieldType, writer)
        break
      }
    }
  } else {
    throw new BorshError(`Unexpected schema for ${obj.constructor.name}`)
  }
}

/// Serialize given object using schema of the form:
/// { class_name -> [ [field_name, field_type], .. ], .. }
export function serialize(schema: Schema, obj: any) {
  const writer = new BinaryWriter()
  serializeStruct(schema, obj, writer)
  return writer.toArray()
}

function deserializeField(schema: Schema, fieldName: string, fieldType: any, reader: BinaryReader): any {
  try {
    if (typeof fieldType === 'string') {
      return reader[`read_${fieldType}`]()
    }

    if (fieldType instanceof Array) {
      if (typeof fieldType[0] === 'number') {
        return reader.read_fixed_array(fieldType[0])
      }

      return reader.read_array(() => deserializeField(schema, fieldName, fieldType[0], reader))
    }

    if (fieldType.kind !== undefined) {
      switch (fieldType.kind) {
        case 'option': {
          const op = reader.read_u8()
          if (op === 1) {
            return deserializeField(schema, fieldName, fieldType.type, reader)
          } else if (op === 0) {
            return null
          } else {
            throw new BorshError(`Invalid option type`)
          }
        }
        default:
          throw new BorshError(`FieldType ${fieldType} unrecognized`)
      }
    }

    return deserializeStruct(schema, fieldType, reader)
  } catch (error) {
    if (error instanceof BorshError) {
      error.addToFieldPath(fieldName)
    }
    throw error
  }
}

function deserializeStruct(schema: Schema, classType: any, reader: BinaryReader) {
  const structSchema = schema.get(classType)
  if (!structSchema) {
    throw new BorshError(`Class ${classType.name} is missing in schema`)
  }

  if (structSchema.kind === 'struct') {
    const result = {}
    for (const [fieldName, fieldType] of structSchema.fields) {
      result[fieldName] = deserializeField(schema, fieldName, fieldType, reader)
    }
    return new classType(result)
  }

  if (structSchema.kind === 'enum') {
    const idx = reader.read_u8()
    if (idx >= structSchema.values.length) {
      throw new BorshError(`Enum index: ${idx} is out of range`)
    }
    const [fieldName, fieldType] = structSchema.values[idx]
    const fieldValue = deserializeField(schema, fieldName, fieldType, reader)
    return new classType({ [fieldName]: fieldValue })
  }

  throw new BorshError(`Unexpected schema for ${classType.constructor.name}`)
}

/// Deserializes object from bytes using schema.
export function deserialize<T>(schema: Schema, classType: T, buffer: Buffer): T {
  const reader = new BinaryReader(buffer)
  const result = deserializeStruct(schema, classType, reader)
  return result
}

export abstract class Layout {
  private schema: Schema
  constructor(schema: Schema, properties: any) {
    this.schema = schema
    Object.keys(properties).map((key: any) => {
      ;(this as any)[key] = properties[key]
    })
  }

  encode(): Buffer {
    return serialize(this.schema, this)
  }

  static decode<T>(schema: Schema, classType: any, buf: Buffer): T {
    return deserialize<T>(schema, classType, buf)
  }
}

export function toBuffer(view: Uint8Array): Buffer {
  const buf = Buffer.alloc(view.byteLength)
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i]
  }
  return buf
}
