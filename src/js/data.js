import * as C from './constants.js';
// export function valueToString(valueType: number, value1: number, value2: number) {
//     switch (valueType) {
//         case C.ValueBoolean:        return C.BooleanValueToString[value1]
//         case C.ValueInteger:        return value1.toString()
//         case C.ValueUnaryOperator:  return C.UnaryOperatorToString[value1]
//         case C.ValueBinaryOperator: return C.BinaryOperatorToString[value1]
//         case C.ValueRational:       return `${value1}/${value2}`
//         case C.ValueVariable:       return String.fromCharCode(value1)
//         default:                    return ''
//     }
// }
export function stringToValueType(type, value) {
    switch (type) {
        case C.TypeGate:
            if (isValidInteger(value))
                return C.ValueInteger;
            if (isValidRational(value))
                return C.ValueRational;
            if (isValidVariable(value))
                return C.ValueVariable;
            if (isValidBoolean(value))
                return C.ValueBoolean;
            return C.ValueInvalid;
        case C.TypeConstant:
            if (isValidInteger(value))
                return C.ValueInteger;
            if (isValidRational(value))
                return C.ValueRational;
            if (isValidBoolean(value))
                return C.ValueVariable;
            return C.ValueInvalid;
        case C.TypeVariable:
            if (isValidVariable(value))
                return C.ValueVariable;
            return C.ValueInvalid;
        case C.TypeDefinition:
            if (isValidVariable(value))
                return C.ValueVariable;
            return C.ValueInvalid;
        case C.TypeUnaryOperator:
            if (isValidUnaryOperator(value))
                return C.ValueUnaryOperator;
            return C.ValueInvalid;
        case C.TypeBinaryOperator:
            if (isValidBinaryOperator(value))
                return C.ValueBinaryOperator;
            return C.ValueInvalid;
        case C.TypeTeleport:
            if (isValidTeleport(value))
                return C.ValuePoint;
            return C.ValueInvalid;
        case C.TypeMonument: return C.ValueText;
    }
    return value.length > 0 ? C.ValueInvalid : C.ValueNone;
}
export function stringToOperandType(value) {
    if (isValidInteger(value))
        return C.OperandTypeNumeric;
    if (isValidRational(value))
        return C.OperandTypeNumeric;
    if (isValidBoolean(value))
        return C.OperandTypeBoolean;
    return C.OperandTypeInvalid;
}
export function areValidGatePorts(ports) {
    const e = ports & C.PortIn1East;
    const s = ports & C.PortIn1South;
    const w = ports & C.PortIn1West;
    const n = ports & C.PortIn1North;
    if (e !== C.PortIn1East && e !== C.PortNone)
        return false;
    if (s !== C.PortIn1South && s !== C.PortNone)
        return false;
    if (w !== C.PortIn1West && w !== C.PortNone)
        return false;
    if (n !== C.PortIn1North && n !== C.PortNone)
        return false;
    return true;
}
export function areValidArithmagicianPorts(ports) {
    const e = ports & C.PortOutEast;
    const s = ports & C.PortOutSouth;
    const w = ports & C.PortOutWest;
    const n = ports & C.PortOutNorth;
    if (e === C.PortOutEast && s + w + n === 0)
        return true;
    if (s === C.PortOutSouth && e + w + n === 0)
        return true;
    if (w === C.PortOutWest && e + s + n === 0)
        return true;
    if (n === C.PortOutNorth && e + s + w === 0)
        return true;
    return false;
}
export function areValidConstantPorts(ports) {
    const e = ports & C.PortOutEast;
    const s = ports & C.PortOutSouth;
    const w = ports & C.PortOutWest;
    const n = ports & C.PortOutNorth;
    if (e !== C.PortOutEast && e !== C.PortNone)
        return false;
    if (s !== C.PortOutSouth && s !== C.PortNone)
        return false;
    if (w !== C.PortOutWest && w !== C.PortNone)
        return false;
    if (n !== C.PortOutNorth && n !== C.PortNone)
        return false;
    return true;
}
export function areValidVariablePorts(ports) {
    const e = ports & C.PortOutEast;
    const s = ports & C.PortOutSouth;
    const w = ports & C.PortOutWest;
    const n = ports & C.PortOutNorth;
    if (e !== C.PortOutEast && e !== C.PortNone)
        return false;
    if (s !== C.PortOutSouth && s !== C.PortNone)
        return false;
    if (w !== C.PortOutWest && w !== C.PortNone)
        return false;
    if (n !== C.PortOutNorth && n !== C.PortNone)
        return false;
    return true;
}
export function areValidDefinitionPorts(ports) {
    if (ports === C.PortIn1East)
        return true;
    if (ports === C.PortIn1South)
        return true;
    if (ports === C.PortIn1West)
        return true;
    if (ports === C.PortIn1North)
        return true;
    return false;
}
export function areValidUnaryOperatorPorts(ports) {
    const counts = new Uint8Array(4);
    counts[ports & 0b00000011]++;
    counts[(ports >> 2) & 0b00000011]++;
    counts[(ports >> 4) & 0b00000011]++;
    counts[(ports >> 6) & 0b00000011]++;
    return counts[1] === 1 && counts[3] >= 1;
}
export function areValidBinaryOperatorPorts(ports) {
    const counts = new Uint8Array(4);
    counts[ports & 0b00000011]++;
    counts[(ports >> 2) & 0b00000011]++;
    counts[(ports >> 4) & 0b00000011]++;
    counts[(ports >> 6) & 0b00000011]++;
    return counts[1] === 1 && counts[2] === 1 && counts[3] >= 1;
}
export function isValidInteger(value) {
    return /^(0|-?[1-9]\d?)$/.test(value);
}
export function isValidRational(value) {
    return /^(0|-?[1-9]\d?)\/[1-9]\d?$/.test(value);
}
export function isValidBoolean(value) {
    return /^(true|false)$/.test(value);
}
export function isValidVariable(value) {
    return /^[a-z]$/.test(value);
}
export function isValidUnaryOperator(value) {
    return C.StringToUnaryOperator.hasOwnProperty(value);
}
export function isValidBinaryOperator(value) {
    return C.StringToBinaryOperator.hasOwnProperty(value);
}
export function isValidTeleport(value) {
    const tokens = value.split(' ');
    if (tokens.length !== 2)
        return false;
    if (!/^\d+$/.test(tokens[0]) || !/^\d+$/.test(tokens[1]))
        return false;
    const x = parseInt(tokens[0]);
    const y = parseInt(tokens[1]);
    return x > 0 && x < C.WorldWidthCells - 1 && y > 0 && y < C.WorldWidthCells - 1;
}
