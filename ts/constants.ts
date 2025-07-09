import Rect from "./rect.js"

//  #####   #######  #     #  #######  ######      #     #        
// #     #  #        ##    #  #        #     #    # #    #        
// #        #        # #   #  #        #     #   #   #   #        
// #        ####     #  #  #  ####     ######   #######  #        
// #   ###  #        #   # #  #        #   #    #     #  #        
// #     #  #        #    ##  #        #    #   #     #  #        
//  #####   #######  #     #  #######  #     #  #     #  #######  

export const EmptyString                    = ''
export const CharSpace                      = ' '
export const Tau                            = Math.PI * 2
export const FontWidth                      = 8
export const FontHeight                     = 14
export const FontPaddingTop                 = 1
export const FontPaddingBottom              = 2
export const FractionHeight                 = 4
export const Fraction1Width                 = FontWidth
export const Fraction2Width                 = FontWidth * 2
export const MinusWidth                     = 6
export const WorldWidthCells                = 256
export const WorldHeightCells               = 256
export const InnerWorldRectCells            = new Rect(1, 1, WorldWidthCells - 2, WorldHeightCells - 2)
export const CellSizePixels                 = 60
export const HalfCellSizePixels             = CellSizePixels / 2
export const DisplayWidthCells              = 16
export const DisplayHeightCells             = 9
export const DisplayWidthPixels             = DisplayWidthCells * CellSizePixels
export const DisplayHeightPixels            = DisplayHeightCells * CellSizePixels
export const HalfDisplayWidthPixels         = DisplayWidthPixels / 2
export const HalfDisplayHeightPixels        = DisplayHeightPixels / 2
export const DefinitionRadiusPixels         = CellSizePixels * 5 + 3
export const DefinitionRadiusSquaredPixels  = DefinitionRadiusPixels * DefinitionRadiusPixels
export const ZoomFactor                     = 8 / 7
export const ConnectionScalar               = 0.2
export const MovementFrames                 = 10 // Should be a factor of 60 (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60)
export const MovementSpeed                  = CellSizePixels / MovementFrames
export const HalfMovementFrames             = MovementFrames / 2
export const CellSingleX                    = (CellSizePixels - FontWidth) / 2
export const CellDoubleX1                   = CellSizePixels / 2 - FontWidth
export const CellDoubleX2                   = CellSizePixels / 2
export const CellIntegerY                   = (CellSizePixels - FontHeight) / 2
export const CellFractionY                  = (CellSizePixels - FractionHeight) / 2
export const CellNumeratorY                 = CellFractionY - 1 - FontHeight + FontPaddingBottom
export const CellDenominatorY               = CellFractionY + FractionHeight + 1 - FontPaddingTop
export const CellMinusXSingle               = CellSingleX - 1 - MinusWidth
export const CellMinusXDouble               = CellDoubleX1 - 1 - MinusWidth
export const MaxMessageWidth                = Math.floor(DisplayWidthPixels / FontWidth / 2)
export const MouseButtonNone                = 0
export const MouseButtonLeft                = 1
export const MouseButtonRight               = 2
export const ModifierKeyNone                = 0
export const ModifierKeySpace               = 1
export const ModifierKeyCtrl                = 2
export const ModifierKeyShift               = 3
export const ActionNone                     = 0
export const ActionBuild                    = 1
export const ActionErase                    = 2
export const ActionConnect                  = 3
export const ActionDisconnect               = 4
export const ActionInspect                  = 5
export const ActionSelect                   = 6
export const ActionUnselect                 = 7
export const ActionDragSelect               = 8
export const ActionDragUnselect             = 9
export const ActionPan                      = 10
export const CellUnselected                 = 0
export const CellSelected                   = 1
export const MaxDarkness                    = 4

export const WandXEast                      = 59
export const WandXSouth                     = 14
export const WandXWest                      = 1
export const WandXNorth                     = 46

export const WandYEast                      = 46
export const WandYSouth                     = 59
export const WandYWest                      = 14
export const WandYNorth                     = 1

export const Darkness = [
    0.0,
    0.25,
    0.5,
    0.75,
    1.0
]

export const ActionToString = [
    'ActionNone',
    'ActionBuild',
    'ActionErase',
    'ActionConnect',
    'ActionDisconnect',
    'ActionInspect',
    'ActionSelect',
    'ActionUnselect',
    'ActionPan',
]

// #######  #     #  ######   #######   #####   
//    #      #   #   #     #  #        #     #  
//    #       # #    #     #  #        #        
//    #        #     ######   ####      #####   
//    #        #     #        #              #  
//    #        #     #        #        #     #  
//    #        #     #        #######   #####   

export const TypeEmpty              = 0
export const TypeGoldWall           = 1
export const TypeBlueTile           = 2
export const TypeSlateTile          = 3
export const TypeCrate              = 4
export const TypeBars               = 5
export const TypeBinding            = 6
export const TypeGlass              = 7
export const TypeStoneHead          = 8
export const TypePiping             = 9
export const TypeUnaryOperator      = 10
export const TypeBinaryOperator     = 11
export const TypeGate               = 12
export const TypeConstant           = 13
export const TypeVariable           = 14
export const TypeSelection          = 15
export const TypeOffLimits          = 16
export const TypeBush               = 17
export const TypeDirt               = 18
export const TypeBasin              = 19
export const TypeCovering           = 20
export const TypeArithmagician      = 21
export const TypeNoCamera           = 22
export const TypeTeleport           = 23
export const TypeDefinition         = 24
export const TypeMonument           = 25
export const TypePetrified          = 26

export const TilesetNone            = 0
export const TilesetConnected       = 1 // Standard tiling
export const TilesetBlock           = 2 // Single image
export const TilesetOrthogonal      = 3 // Can face 4 directions
export const TilesetIO              = 4 // Each direction can be none, in 1, in2, or out
export const TilesetEmitter         = 5 // Each direction can be t/f
export const TilesetReceiver        = 6 // Each direction can be t/f
export const TilesetArithmagician   = 7 // TBD

export const TilesetHorizontal      = 5 // Connects to horizontal neighbors
export const TilesetVertical        = 6 // Connects to vertical neighbors
export const TilesetOctilinear      = 7 // Can point in 8 directions
export const TilesetDiagonal        = 8 // Can point in diagonal directions

export const CharCodeA              = 'a'.charCodeAt(0)
export const CharCodeZ              = 'z'.charCodeAt(0)
export const CharCode0              = '0'.charCodeAt(0)
export const CharCode9              = '9'.charCodeAt(0)

export const TypeToTileset: number[] = [
    TilesetNone,
    TilesetConnected,
    TilesetConnected,
    TilesetConnected,
    TilesetConnected,
    TilesetConnected,
    TilesetConnected,
    TilesetConnected,
    TilesetBlock,
    TilesetConnected,
    TilesetIO,
    TilesetIO,
    TilesetReceiver,
    TilesetEmitter,
    TilesetEmitter,
    TilesetConnected,
    TilesetBlock,
    TilesetConnected,
    TilesetBlock,
    TilesetConnected,
    TilesetConnected,
    TilesetArithmagician,
    TilesetBlock,
    TilesetBlock,
    TilesetOrthogonal,
    TilesetBlock,
    TilesetArithmagician,
]
export const StringToType: { [key: string]: number } = {
    TypeEmpty:          TypeEmpty,
    TypeGoldWall:       TypeGoldWall,
    TypeBlueTile:       TypeBlueTile,
    TypeSlateTile:      TypeSlateTile,
    TypeCrate:          TypeCrate,
    TypeBars:           TypeBars,
    TypeBinding:        TypeBinding,
    TypeGlass:          TypeGlass,
    TypeStoneHead:      TypeStoneHead,
    TypePiping:         TypePiping,
    TypeUnaryOperator:  TypeUnaryOperator,
    TypeBinaryOperator: TypeBinaryOperator,
    TypeGate:           TypeGate,
    TypeConstant:       TypeConstant,
    TypeVariable:       TypeVariable,
    TypeSelection:      TypeSelection,
    TypeOffLimits:      TypeOffLimits,
    TypeBush:           TypeBush,
    TypeDirt:           TypeDirt,
    TypeBasin:          TypeBasin,
    TypeCovering:       TypeCovering,
    TypeArithmagician:  TypeArithmagician,
    TypeNoCamera:       TypeNoCamera,
    TypeTeleport:       TypeTeleport,
    TypeDefinition:     TypeDefinition,
    TypeMonument:       TypeMonument,
    TypePetrified:      TypePetrified,
}

export const TypeToString: string[] = [
    'TypeEmpty',
    'TypeGoldWall',
    'TypeBlueTile',
    'TypeSlateTile',
    'TypeCrate',
    'TypeBars',
    'TypeBinding',
    'TypeGlass',
    'TypeStoneHead',
    'TypePiping',
    'TypeUnaryOperator',
    'TypeBinaryOperator',
    'TypeGate',
    'TypeConstant',
    'TypeVariable',
    'TypeSelection',
    'TypeOffLimits',
    'TypeBush',
    'TypeDirt',
    'TypeBasin',
    'TypeCovering',
    'TypeArithmagician',
    'TypeNoCamera',
    'TypeTeleport',
    'TypeDefinition',
    'TypeMonument',
    'TypePetrified',
]

export const TypeIsImmobile: boolean[] = [
    false,
    true,
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    true,
    true,
    true,
    true,
    false,
    false,
    true,
    true,
    false,
    true,
    false,
]
export const TypeIsTransparent: boolean[] = [
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
]


// #           #     #     #  #######  ######    #####   
// #          # #     #   #   #        #     #  #     #  
// #         #   #     # #    #        #     #  #        
// #        #######     #     ####     ######    #####   
// #        #     #     #     #        #   #          #  
// #        #     #     #     #        #    #   #     #  
// #######  #     #     #     #######  #     #   #####   

export const LayerNone      = 0
export const LayerFloor     = 1
export const LayerObject    = 2
export const LayerRoof      = 3
export const LayerCamera    = 4
export const StringToLayer: { [key: string]: number } = {
    LayerNone:      LayerNone,
    LayerFloor:     LayerFloor,
    LayerObject:    LayerObject,
    LayerRoof:      LayerRoof,
    LayerCamera:    LayerCamera,
}
export const LayerToString: string[] = [
    'LayerNone',
    'LayerFloor',
    'LayerObject',
    'LayerRoof',
    'LayerCamera',
]


export const ToolBuild      = 0
export const ToolConnect    = 1
export const ToolSelect     = 2
export const StringToTool: { [key: string]: number } = {
    ToolBuild:      ToolBuild,
    ToolConnect:    ToolConnect,
    ToolSelect:     ToolSelect,
}
export const ToolToString: string[] = [
    'ToolBuild',
    'ToolConnect',
    'ToolSelect',
]

// ######   #######  #######   #####   
// #     #     #        #     #     #  
// #     #     #        #     #        
// ######      #        #      #####   
// #     #     #        #           #  
// #     #     #        #     #     #  
// ######   #######     #      #####   

export const FlagsNone      = 0b00000000
export const FlagsTraversed = 0b00000001
export const FlagsMoving    = 0b00000010
export const FlagsUnlocked  = 0b00000100
export const FlagsInvalid   = 0b00001000
export const FlagsInactive  = 0b00010000
export const FlagsPetrified = 0b00100000
export const FlagsAll       = 0b11111111

export const BitsNone       = 0b00000000
export const BitsEast       = 0b00000001
export const BitsSouth      = 0b00000010
export const BitsWest       = 0b00000100
export const BitsNorth      = 0b00001000
export const BitsSoutheast  = 0b00010000
export const BitsSouthwest  = 0b00100000
export const BitsNorthwest  = 0b01000000
export const BitsNortheast  = 0b10000000

export const BitsToOffset = {
    [BitsEast]:     0,
    [BitsSouth]:    1,
    [BitsWest]:     2,
    [BitsNorth]:    3,
}

export const PortMaskEast   = 0b00000011
export const PortMaskSouth  = 0b00001100
export const PortMaskWest   = 0b00110000
export const PortMaskNorth  = 0b11000000

export const PortNone       = 0b00000000
export const PortIn1        = 0b00000001
export const PortIn2        = 0b00000010
export const PortOut        = 0b00000011

export const PortOutEast    = 0b00000011
export const PortOutSouth   = 0b00001100
export const PortOutWest    = 0b00110000
export const PortOutNorth   = 0b11000000

export const PortIn1East    = 0b00000001
export const PortIn1South   = 0b00000100
export const PortIn1West    = 0b00010000
export const PortIn1North   = 0b01000000

export const PortIn2East    = 0b00000010
export const PortIn2South   = 0b00001000
export const PortIn2West    = 0b00100000
export const PortIn2North   = 0b10000000






export const OperandTypeAny                 = 0
export const OperandTypeNumeric             = 1
export const OperandTypeBoolean             = 2
export const OperandTypeInvalid             = 3

export const ValueNone                      = 0
export const ValueBoolean                   = 1
export const ValueInteger                   = 2
export const ValueRational                  = 3
export const ValueVariable                  = 4
export const ValueUnaryOperator             = 5
export const ValueBinaryOperator            = 6
export const ValueText                      = 7
export const ValuePoint                     = 8
export const ValueInvalid                   = 9

export const UnaryOperatorNone              = 0
export const UnaryOperatorNegation          = 1
export const UnaryOperatorNot               = 2

export const BinaryOperatorAddition         = 0
export const BinaryOperatorSubtraction      = 1
export const BinaryOperatorMultiplication   = 2
export const BinaryOperatorDivision         = 3
export const BinaryOperatorExponentiation   = 4
export const BinaryOperatorEquation         = 5
export const BinaryOperatorAnd              = 6
export const BinaryOperatorOr               = 7

// export const BinaryOperatorGreaterThan      = 8 // precedence is visually weird

export const UnaryOperatorInputType = [
    OperandTypeAny,
    OperandTypeNumeric,
    OperandTypeBoolean,
]
export const UnaryOperatorOutputType = [
    OperandTypeAny,
    OperandTypeNumeric,
    OperandTypeBoolean,
]
export const BinaryOperatorInputType = [
    OperandTypeNumeric,
    OperandTypeNumeric,
    OperandTypeNumeric,
    OperandTypeNumeric,
    OperandTypeNumeric,
    OperandTypeAny,
    OperandTypeBoolean,
    OperandTypeBoolean,
]
export const BinaryOperatorOutputType = [
    OperandTypeNumeric,
    OperandTypeNumeric,
    OperandTypeNumeric,
    OperandTypeNumeric,
    OperandTypeNumeric,
    OperandTypeBoolean,
    OperandTypeBoolean,
    OperandTypeBoolean,
]


export const BooleanValueFalse              = 0
export const BooleanValueTrue               = 1

export const StringToUnaryOperator: { [key: string]: number } = {
    '':     UnaryOperatorNone,
    '-':    UnaryOperatorNegation,
    'not':  UnaryOperatorNot,
}
export const UnaryOperatorToString = [
    '',
    '-',
    'not',
]

export const StringToBinaryOperator: { [key: string]: number } = {
    '+':    BinaryOperatorAddition,
    '-':    BinaryOperatorSubtraction,
    '*':    BinaryOperatorMultiplication,
    '/':    BinaryOperatorDivision,
    '^':    BinaryOperatorExponentiation,
    '=':    BinaryOperatorEquation,
    'and':  BinaryOperatorAnd,
    'or':   BinaryOperatorOr,
}
export const BinaryOperatorToString = [
    '+',
    '-',
    '*',
    '/',
    '^',
    '=',
    'and',
    'or',
]


export const StringToBooleanValue: { [key: string]: number } = {
    'false':    BooleanValueFalse,
    'true':     BooleanValueTrue,
}
export const BooleanValueToString = [
    'false',
    'true',
]