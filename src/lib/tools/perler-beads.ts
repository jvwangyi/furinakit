// 拼豆底稿生成器 — 参考 Zippland/perler-beads

// 纯浏览器端实现，使用 Canvas API

// 支持 Floyd-Steinberg 抖动算法、多品牌色板、感知加权颜色匹配

export interface PerlerColor {

  id: string;

  name: string;

  hex: string;

  brand: string;

}



export interface PerlerOptions {

  gridSize: number;  // 格子数（含义取决于 gridMode）

  gridMode?: 'maxEdge' | 'height';  // maxEdge=最大边格子数（默认），height=以高度为基准

  palette: string;

  mergeSimilar: boolean;

  removeBackground: boolean;

  dithering: boolean;

  pixelMode: 'dominant' | 'average' | 'smart' | 'sketch-guided' | 'enhanced';

  // 颜色匹配算法

  colorDistance: 'oklab' | 'rgb' | 'ciede2000';

  // 预处理选项

  preprocess: PreprocessOptions;

  // 排除的颜色ID列表

  excludedColors?: string[];

  // 是否保持宽高比（默认 true）

  keepAspectRatio?: boolean;

  // 是否空心圆（默认 true）

  hollowCircle?: boolean;

}



// ==================== 内置色板 ====================



export const PALETTES: Record<string, PerlerColor[]> = {

  mard221: [

    { id: 'A1', name: 'A1', hex: '#FAF4C8', brand: 'MARD' },

    { id: 'A2', name: 'A2', hex: '#FFFFD5', brand: 'MARD' },

    { id: 'A3', name: 'A3', hex: '#FEFF8B', brand: 'MARD' },

    { id: 'A4', name: 'A4', hex: '#FBED56', brand: 'MARD' },

    { id: 'A5', name: 'A5', hex: '#F4D738', brand: 'MARD' },

    { id: 'A6', name: 'A6', hex: '#FEAC4C', brand: 'MARD' },

    { id: 'A7', name: 'A7', hex: '#FE8B4C', brand: 'MARD' },

    { id: 'A8', name: 'A8', hex: '#FFDA45', brand: 'MARD' },

    { id: 'A9', name: 'A9', hex: '#FF995B', brand: 'MARD' },

    { id: 'A10', name: 'A10', hex: '#F77C31', brand: 'MARD' },

    { id: 'A11', name: 'A11', hex: '#FFDD99', brand: 'MARD' },

    { id: 'A12', name: 'A12', hex: '#FE9F72', brand: 'MARD' },

    { id: 'A13', name: 'A13', hex: '#FFC365', brand: 'MARD' },

    { id: 'A14', name: 'A14', hex: '#FD543D', brand: 'MARD' },

    { id: 'A15', name: 'A15', hex: '#FFF365', brand: 'MARD' },

    { id: 'A16', name: 'A16', hex: '#FFFF9F', brand: 'MARD' },

    { id: 'A17', name: 'A17', hex: '#FFE36E', brand: 'MARD' },

    { id: 'A18', name: 'A18', hex: '#FEBE7D', brand: 'MARD' },

    { id: 'A19', name: 'A19', hex: '#FD7C72', brand: 'MARD' },

    { id: 'A20', name: 'A20', hex: '#FFD568', brand: 'MARD' },

    { id: 'A21', name: 'A21', hex: '#FFE395', brand: 'MARD' },

    { id: 'A22', name: 'A22', hex: '#F4F57D', brand: 'MARD' },

    { id: 'A23', name: 'A23', hex: '#E6C9B7', brand: 'MARD' },

    { id: 'A24', name: 'A24', hex: '#F7F8A2', brand: 'MARD' },

    { id: 'A25', name: 'A25', hex: '#FFD67D', brand: 'MARD' },

    { id: 'A26', name: 'A26', hex: '#FFC830', brand: 'MARD' },

    { id: 'B1', name: 'B1', hex: '#E6EE31', brand: 'MARD' },

    { id: 'B2', name: 'B2', hex: '#63F347', brand: 'MARD' },

    { id: 'B3', name: 'B3', hex: '#9EF780', brand: 'MARD' },

    { id: 'B4', name: 'B4', hex: '#5DE035', brand: 'MARD' },

    { id: 'B5', name: 'B5', hex: '#35E352', brand: 'MARD' },

    { id: 'B6', name: 'B6', hex: '#65E2A6', brand: 'MARD' },

    { id: 'B7', name: 'B7', hex: '#3DAF80', brand: 'MARD' },

    { id: 'B8', name: 'B8', hex: '#1C9C4F', brand: 'MARD' },

    { id: 'B9', name: 'B9', hex: '#27523A', brand: 'MARD' },

    { id: 'B10', name: 'B10', hex: '#95D3C2', brand: 'MARD' },

    { id: 'B11', name: 'B11', hex: '#5D722A', brand: 'MARD' },

    { id: 'B12', name: 'B12', hex: '#166F41', brand: 'MARD' },

    { id: 'B13', name: 'B13', hex: '#CAEB7B', brand: 'MARD' },

    { id: 'B14', name: 'B14', hex: '#ADE946', brand: 'MARD' },

    { id: 'B15', name: 'B15', hex: '#2E5132', brand: 'MARD' },

    { id: 'B16', name: 'B16', hex: '#C5ED9C', brand: 'MARD' },

    { id: 'B17', name: 'B17', hex: '#9BB13A', brand: 'MARD' },

    { id: 'B18', name: 'B18', hex: '#E6EE49', brand: 'MARD' },

    { id: 'B19', name: 'B19', hex: '#24B88C', brand: 'MARD' },

    { id: 'B20', name: 'B20', hex: '#C2F0CC', brand: 'MARD' },

    { id: 'B21', name: 'B21', hex: '#156A6B', brand: 'MARD' },

    { id: 'B22', name: 'B22', hex: '#0B3C43', brand: 'MARD' },

    { id: 'B23', name: 'B23', hex: '#303A21', brand: 'MARD' },

    { id: 'B24', name: 'B24', hex: '#EEFCA5', brand: 'MARD' },

    { id: 'B25', name: 'B25', hex: '#4E846D', brand: 'MARD' },

    { id: 'B26', name: 'B26', hex: '#8D7A35', brand: 'MARD' },

    { id: 'B27', name: 'B27', hex: '#CCE1AF', brand: 'MARD' },

    { id: 'B28', name: 'B28', hex: '#9EE5B9', brand: 'MARD' },

    { id: 'B29', name: 'B29', hex: '#C5E254', brand: 'MARD' },

    { id: 'B30', name: 'B30', hex: '#E2FCB1', brand: 'MARD' },

    { id: 'B31', name: 'B31', hex: '#B0E792', brand: 'MARD' },

    { id: 'B32', name: 'B32', hex: '#9CAB5A', brand: 'MARD' },

    { id: 'C1', name: 'C1', hex: '#E8FFE7', brand: 'MARD' },

    { id: 'C2', name: 'C2', hex: '#A9F9FC', brand: 'MARD' },

    { id: 'C3', name: 'C3', hex: '#A0E2FB', brand: 'MARD' },

    { id: 'C4', name: 'C4', hex: '#41CCFF', brand: 'MARD' },

    { id: 'C5', name: 'C5', hex: '#01ACEB', brand: 'MARD' },

    { id: 'C6', name: 'C6', hex: '#50AAF0', brand: 'MARD' },

    { id: 'C7', name: 'C7', hex: '#3677D2', brand: 'MARD' },

    { id: 'C8', name: 'C8', hex: '#0F54C0', brand: 'MARD' },

    { id: 'C9', name: 'C9', hex: '#324BCA', brand: 'MARD' },

    { id: 'C10', name: 'C10', hex: '#3EBCE2', brand: 'MARD' },

    { id: 'C11', name: 'C11', hex: '#28DDDE', brand: 'MARD' },

    { id: 'C12', name: 'C12', hex: '#1C334D', brand: 'MARD' },

    { id: 'C13', name: 'C13', hex: '#CDE8FF', brand: 'MARD' },

    { id: 'C14', name: 'C14', hex: '#D5FDFF', brand: 'MARD' },

    { id: 'C15', name: 'C15', hex: '#22C4C6', brand: 'MARD' },

    { id: 'C16', name: 'C16', hex: '#1557A8', brand: 'MARD' },

    { id: 'C17', name: 'C17', hex: '#04D1F6', brand: 'MARD' },

    { id: 'C18', name: 'C18', hex: '#1D3344', brand: 'MARD' },

    { id: 'C19', name: 'C19', hex: '#1887A2', brand: 'MARD' },

    { id: 'C20', name: 'C20', hex: '#176DAF', brand: 'MARD' },

    { id: 'C21', name: 'C21', hex: '#BEDDFF', brand: 'MARD' },

    { id: 'C22', name: 'C22', hex: '#67B4BE', brand: 'MARD' },

    { id: 'C23', name: 'C23', hex: '#C8E2FF', brand: 'MARD' },

    { id: 'C24', name: 'C24', hex: '#7CC4FF', brand: 'MARD' },

    { id: 'C25', name: 'C25', hex: '#A9E5E5', brand: 'MARD' },

    { id: 'C26', name: 'C26', hex: '#3CAED8', brand: 'MARD' },

    { id: 'C27', name: 'C27', hex: '#D3DFFA', brand: 'MARD' },

    { id: 'C28', name: 'C28', hex: '#BBCFED', brand: 'MARD' },

    { id: 'C29', name: 'C29', hex: '#34488E', brand: 'MARD' },

    { id: 'D1', name: 'D1', hex: '#AEB4F2', brand: 'MARD' },

    { id: 'D2', name: 'D2', hex: '#858EDD', brand: 'MARD' },

    { id: 'D3', name: 'D3', hex: '#2F54AF', brand: 'MARD' },

    { id: 'D4', name: 'D4', hex: '#182A84', brand: 'MARD' },

    { id: 'D5', name: 'D5', hex: '#B843C5', brand: 'MARD' },

    { id: 'D6', name: 'D6', hex: '#AC7BDE', brand: 'MARD' },

    { id: 'D7', name: 'D7', hex: '#8854B3', brand: 'MARD' },

    { id: 'D8', name: 'D8', hex: '#E2D3FF', brand: 'MARD' },

    { id: 'D9', name: 'D9', hex: '#D5B9F8', brand: 'MARD' },

    { id: 'D10', name: 'D10', hex: '#361851', brand: 'MARD' },

    { id: 'D11', name: 'D11', hex: '#B9BAE1', brand: 'MARD' },

    { id: 'D12', name: 'D12', hex: '#DE9AD4', brand: 'MARD' },

    { id: 'D13', name: 'D13', hex: '#B90095', brand: 'MARD' },

    { id: 'D14', name: 'D14', hex: '#8B279B', brand: 'MARD' },

    { id: 'D15', name: 'D15', hex: '#2F1F90', brand: 'MARD' },

    { id: 'D16', name: 'D16', hex: '#E3E1EE', brand: 'MARD' },

    { id: 'D17', name: 'D17', hex: '#C4D4F6', brand: 'MARD' },

    { id: 'D18', name: 'D18', hex: '#A45EC7', brand: 'MARD' },

    { id: 'D19', name: 'D19', hex: '#D8C3D7', brand: 'MARD' },

    { id: 'D20', name: 'D20', hex: '#9C32B2', brand: 'MARD' },

    { id: 'D21', name: 'D21', hex: '#9A009B', brand: 'MARD' },

    { id: 'D22', name: 'D22', hex: '#333A95', brand: 'MARD' },

    { id: 'D23', name: 'D23', hex: '#EBDAFC', brand: 'MARD' },

    { id: 'D24', name: 'D24', hex: '#7786E5', brand: 'MARD' },

    { id: 'D25', name: 'D25', hex: '#494FC7', brand: 'MARD' },

    { id: 'D26', name: 'D26', hex: '#DFC2F8', brand: 'MARD' },

    { id: 'E1', name: 'E1', hex: '#FDD3CC', brand: 'MARD' },

    { id: 'E2', name: 'E2', hex: '#FEC0DF', brand: 'MARD' },

    { id: 'E3', name: 'E3', hex: '#FFB7E7', brand: 'MARD' },

    { id: 'E4', name: 'E4', hex: '#E8649E', brand: 'MARD' },

    { id: 'E5', name: 'E5', hex: '#F551A2', brand: 'MARD' },

    { id: 'E6', name: 'E6', hex: '#F13D74', brand: 'MARD' },

    { id: 'E7', name: 'E7', hex: '#C63478', brand: 'MARD' },

    { id: 'E8', name: 'E8', hex: '#FFDBE9', brand: 'MARD' },

    { id: 'E9', name: 'E9', hex: '#E970CC', brand: 'MARD' },

    { id: 'E10', name: 'E10', hex: '#D33793', brand: 'MARD' },

    { id: 'E11', name: 'E11', hex: '#FCDDD2', brand: 'MARD' },

    { id: 'E12', name: 'E12', hex: '#F78FC3', brand: 'MARD' },

    { id: 'E13', name: 'E13', hex: '#B5006D', brand: 'MARD' },

    { id: 'E14', name: 'E14', hex: '#FFD1BA', brand: 'MARD' },

    { id: 'E15', name: 'E15', hex: '#F8C7C9', brand: 'MARD' },

    { id: 'E16', name: 'E16', hex: '#FFF3EB', brand: 'MARD' },

    { id: 'E17', name: 'E17', hex: '#FFE2EA', brand: 'MARD' },

    { id: 'E18', name: 'E18', hex: '#FFC7DB', brand: 'MARD' },

    { id: 'E19', name: 'E19', hex: '#FEBAD5', brand: 'MARD' },

    { id: 'E20', name: 'E20', hex: '#D8C7D1', brand: 'MARD' },

    { id: 'E21', name: 'E21', hex: '#BD9DA1', brand: 'MARD' },

    { id: 'E22', name: 'E22', hex: '#B785A1', brand: 'MARD' },

    { id: 'E23', name: 'E23', hex: '#937A8D', brand: 'MARD' },

    { id: 'E24', name: 'E24', hex: '#E1BCE8', brand: 'MARD' },

    { id: 'F1', name: 'F1', hex: '#FD957B', brand: 'MARD' },

    { id: 'F2', name: 'F2', hex: '#FC3D46', brand: 'MARD' },

    { id: 'F3', name: 'F3', hex: '#F74941', brand: 'MARD' },

    { id: 'F4', name: 'F4', hex: '#FC283C', brand: 'MARD' },

    { id: 'F5', name: 'F5', hex: '#E7002F', brand: 'MARD' },

    { id: 'F6', name: 'F6', hex: '#943630', brand: 'MARD' },

    { id: 'F7', name: 'F7', hex: '#971937', brand: 'MARD' },

    { id: 'F8', name: 'F8', hex: '#BC0028', brand: 'MARD' },

    { id: 'F9', name: 'F9', hex: '#E2677A', brand: 'MARD' },

    { id: 'F10', name: 'F10', hex: '#8A4526', brand: 'MARD' },

    { id: 'F11', name: 'F11', hex: '#5A2121', brand: 'MARD' },

    { id: 'F12', name: 'F12', hex: '#FD4E6A', brand: 'MARD' },

    { id: 'F13', name: 'F13', hex: '#F35744', brand: 'MARD' },

    { id: 'F14', name: 'F14', hex: '#FFA9AD', brand: 'MARD' },

    { id: 'F15', name: 'F15', hex: '#D30022', brand: 'MARD' },

    { id: 'F16', name: 'F16', hex: '#FEC2A6', brand: 'MARD' },

    { id: 'F17', name: 'F17', hex: '#E69C79', brand: 'MARD' },

    { id: 'F18', name: 'F18', hex: '#D37C46', brand: 'MARD' },

    { id: 'F19', name: 'F19', hex: '#C1444A', brand: 'MARD' },

    { id: 'F20', name: 'F20', hex: '#CD9391', brand: 'MARD' },

    { id: 'F21', name: 'F21', hex: '#F7B4C6', brand: 'MARD' },

    { id: 'F22', name: 'F22', hex: '#FDC0D0', brand: 'MARD' },

    { id: 'F23', name: 'F23', hex: '#F67E66', brand: 'MARD' },

    { id: 'F24', name: 'F24', hex: '#E698AA', brand: 'MARD' },

    { id: 'F25', name: 'F25', hex: '#E54B4F', brand: 'MARD' },

    { id: 'G1', name: 'G1', hex: '#FFE2CE', brand: 'MARD' },

    { id: 'G2', name: 'G2', hex: '#FFC4AA', brand: 'MARD' },

    { id: 'G3', name: 'G3', hex: '#F4C3A5', brand: 'MARD' },

    { id: 'G4', name: 'G4', hex: '#E1B383', brand: 'MARD' },

    { id: 'G5', name: 'G5', hex: '#EDB045', brand: 'MARD' },

    { id: 'G6', name: 'G6', hex: '#E99C17', brand: 'MARD' },

    { id: 'G7', name: 'G7', hex: '#9D5B3E', brand: 'MARD' },

    { id: 'G8', name: 'G8', hex: '#753832', brand: 'MARD' },

    { id: 'G9', name: 'G9', hex: '#E6B483', brand: 'MARD' },

    { id: 'G10', name: 'G10', hex: '#D98C39', brand: 'MARD' },

    { id: 'G11', name: 'G11', hex: '#E0C593', brand: 'MARD' },

    { id: 'G12', name: 'G12', hex: '#FFC890', brand: 'MARD' },

    { id: 'G13', name: 'G13', hex: '#B7714A', brand: 'MARD' },

    { id: 'G14', name: 'G14', hex: '#8D614C', brand: 'MARD' },

    { id: 'G15', name: 'G15', hex: '#FCF9E0', brand: 'MARD' },

    { id: 'G16', name: 'G16', hex: '#F2D9BA', brand: 'MARD' },

    { id: 'G17', name: 'G17', hex: '#78524B', brand: 'MARD' },

    { id: 'G18', name: 'G18', hex: '#FFE4CC', brand: 'MARD' },

    { id: 'G19', name: 'G19', hex: '#E07935', brand: 'MARD' },

    { id: 'G20', name: 'G20', hex: '#A94023', brand: 'MARD' },

    { id: 'G21', name: 'G21', hex: '#B88558', brand: 'MARD' },

    { id: 'H1', name: 'H1', hex: '#FDFBFF', brand: 'MARD' },

    { id: 'H2', name: 'H2', hex: '#FEFFFF', brand: 'MARD' },

    { id: 'H3', name: 'H3', hex: '#B6B1BA', brand: 'MARD' },

    { id: 'H4', name: 'H4', hex: '#89858C', brand: 'MARD' },

    { id: 'H5', name: 'H5', hex: '#48464E', brand: 'MARD' },

    { id: 'H6', name: 'H6', hex: '#2F2B2F', brand: 'MARD' },

    { id: 'H7', name: 'H7', hex: '#000000', brand: 'MARD' },

    { id: 'H8', name: 'H8', hex: '#E7D6DB', brand: 'MARD' },

    { id: 'H9', name: 'H9', hex: '#EDEDED', brand: 'MARD' },

    { id: 'H10', name: 'H10', hex: '#EEE9EA', brand: 'MARD' },

    { id: 'H11', name: 'H11', hex: '#CECDD5', brand: 'MARD' },

    { id: 'H12', name: 'H12', hex: '#FFF5ED', brand: 'MARD' },

    { id: 'H13', name: 'H13', hex: '#F5ECD2', brand: 'MARD' },

    { id: 'H14', name: 'H14', hex: '#CFD7D3', brand: 'MARD' },

    { id: 'H15', name: 'H15', hex: '#98A6A8', brand: 'MARD' },

    { id: 'H16', name: 'H16', hex: '#1D1414', brand: 'MARD' },

    { id: 'H17', name: 'H17', hex: '#F1EDED', brand: 'MARD' },

    { id: 'H18', name: 'H18', hex: '#FFFDF0', brand: 'MARD' },

    { id: 'H19', name: 'H19', hex: '#F6EFE2', brand: 'MARD' },

    { id: 'H20', name: 'H20', hex: '#949FA3', brand: 'MARD' },

    { id: 'H21', name: 'H21', hex: '#FFFBE1', brand: 'MARD' },

    { id: 'H22', name: 'H22', hex: '#CACAD4', brand: 'MARD' },

    { id: 'H23', name: 'H23', hex: '#9A9D94', brand: 'MARD' },

    { id: 'M1', name: 'M1', hex: '#BCC6B8', brand: 'MARD' },

    { id: 'M2', name: 'M2', hex: '#8AA386', brand: 'MARD' },

    { id: 'M3', name: 'M3', hex: '#697D80', brand: 'MARD' },

    { id: 'M4', name: 'M4', hex: '#E3D2BC', brand: 'MARD' },

    { id: 'M5', name: 'M5', hex: '#D0CCAA', brand: 'MARD' },

    { id: 'M6', name: 'M6', hex: '#B0A782', brand: 'MARD' },

    { id: 'M7', name: 'M7', hex: '#B4A497', brand: 'MARD' },

    { id: 'M8', name: 'M8', hex: '#B38281', brand: 'MARD' },

    { id: 'M9', name: 'M9', hex: '#A58767', brand: 'MARD' },

    { id: 'M10', name: 'M10', hex: '#C5B2BC', brand: 'MARD' },

    { id: 'M11', name: 'M11', hex: '#9F7594', brand: 'MARD' },

    { id: 'M12', name: 'M12', hex: '#644749', brand: 'MARD' },

    { id: 'M13', name: 'M13', hex: '#D19066', brand: 'MARD' },

    { id: 'M14', name: 'M14', hex: '#C77362', brand: 'MARD' },

    { id: 'M15', name: 'M15', hex: '#757D78', brand: 'MARD' },

  ],

  mard264: [

    { id: 'A1', name: 'A1', hex: '#FAF4C8', brand: 'MARD' },

    { id: 'A2', name: 'A2', hex: '#FFFFD5', brand: 'MARD' },

    { id: 'A3', name: 'A3', hex: '#FEFF8B', brand: 'MARD' },

    { id: 'A4', name: 'A4', hex: '#FBED56', brand: 'MARD' },

    { id: 'A5', name: 'A5', hex: '#F4D738', brand: 'MARD' },

    { id: 'A6', name: 'A6', hex: '#FEAC4C', brand: 'MARD' },

    { id: 'A7', name: 'A7', hex: '#FE8B4C', brand: 'MARD' },

    { id: 'A8', name: 'A8', hex: '#FFDA45', brand: 'MARD' },

    { id: 'A9', name: 'A9', hex: '#FF995B', brand: 'MARD' },

    { id: 'A10', name: 'A10', hex: '#F77C31', brand: 'MARD' },

    { id: 'A11', name: 'A11', hex: '#FFDD99', brand: 'MARD' },

    { id: 'A12', name: 'A12', hex: '#FE9F72', brand: 'MARD' },

    { id: 'A13', name: 'A13', hex: '#FFC365', brand: 'MARD' },

    { id: 'A14', name: 'A14', hex: '#FD543D', brand: 'MARD' },

    { id: 'A15', name: 'A15', hex: '#FFF365', brand: 'MARD' },

    { id: 'A16', name: 'A16', hex: '#FFFF9F', brand: 'MARD' },

    { id: 'A17', name: 'A17', hex: '#FFE36E', brand: 'MARD' },

    { id: 'A18', name: 'A18', hex: '#FEBE7D', brand: 'MARD' },

    { id: 'A19', name: 'A19', hex: '#FD7C72', brand: 'MARD' },

    { id: 'A20', name: 'A20', hex: '#FFD568', brand: 'MARD' },

    { id: 'A21', name: 'A21', hex: '#FFE395', brand: 'MARD' },

    { id: 'A22', name: 'A22', hex: '#F4F57D', brand: 'MARD' },

    { id: 'A23', name: 'A23', hex: '#E6C9B7', brand: 'MARD' },

    { id: 'A24', name: 'A24', hex: '#F7F8A2', brand: 'MARD' },

    { id: 'A25', name: 'A25', hex: '#FFD67D', brand: 'MARD' },

    { id: 'A26', name: 'A26', hex: '#FFC830', brand: 'MARD' },

    { id: 'B1', name: 'B1', hex: '#E6EE31', brand: 'MARD' },

    { id: 'B2', name: 'B2', hex: '#63F347', brand: 'MARD' },

    { id: 'B3', name: 'B3', hex: '#9EF780', brand: 'MARD' },

    { id: 'B4', name: 'B4', hex: '#5DE035', brand: 'MARD' },

    { id: 'B5', name: 'B5', hex: '#35E352', brand: 'MARD' },

    { id: 'B6', name: 'B6', hex: '#65E2A6', brand: 'MARD' },

    { id: 'B7', name: 'B7', hex: '#3DAF80', brand: 'MARD' },

    { id: 'B8', name: 'B8', hex: '#1C9C4F', brand: 'MARD' },

    { id: 'B9', name: 'B9', hex: '#27523A', brand: 'MARD' },

    { id: 'B10', name: 'B10', hex: '#95D3C2', brand: 'MARD' },

    { id: 'B11', name: 'B11', hex: '#5D722A', brand: 'MARD' },

    { id: 'B12', name: 'B12', hex: '#166F41', brand: 'MARD' },

    { id: 'B13', name: 'B13', hex: '#CAEB7B', brand: 'MARD' },

    { id: 'B14', name: 'B14', hex: '#ADE946', brand: 'MARD' },

    { id: 'B15', name: 'B15', hex: '#2E5132', brand: 'MARD' },

    { id: 'B16', name: 'B16', hex: '#C5ED9C', brand: 'MARD' },

    { id: 'B17', name: 'B17', hex: '#9BB13A', brand: 'MARD' },

    { id: 'B18', name: 'B18', hex: '#E6EE49', brand: 'MARD' },

    { id: 'B19', name: 'B19', hex: '#24B88C', brand: 'MARD' },

    { id: 'B20', name: 'B20', hex: '#C2F0CC', brand: 'MARD' },

    { id: 'B21', name: 'B21', hex: '#156A6B', brand: 'MARD' },

    { id: 'B22', name: 'B22', hex: '#0B3C43', brand: 'MARD' },

    { id: 'B23', name: 'B23', hex: '#303A21', brand: 'MARD' },

    { id: 'B24', name: 'B24', hex: '#EEFCA5', brand: 'MARD' },

    { id: 'B25', name: 'B25', hex: '#4E846D', brand: 'MARD' },

    { id: 'B26', name: 'B26', hex: '#8D7A35', brand: 'MARD' },

    { id: 'B27', name: 'B27', hex: '#CCE1AF', brand: 'MARD' },

    { id: 'B28', name: 'B28', hex: '#9EE5B9', brand: 'MARD' },

    { id: 'B29', name: 'B29', hex: '#C5E254', brand: 'MARD' },

    { id: 'B30', name: 'B30', hex: '#E2FCB1', brand: 'MARD' },

    { id: 'B31', name: 'B31', hex: '#B0E792', brand: 'MARD' },

    { id: 'B32', name: 'B32', hex: '#9CAB5A', brand: 'MARD' },

    { id: 'C1', name: 'C1', hex: '#E8FFE7', brand: 'MARD' },

    { id: 'C2', name: 'C2', hex: '#A9F9FC', brand: 'MARD' },

    { id: 'C3', name: 'C3', hex: '#A0E2FB', brand: 'MARD' },

    { id: 'C4', name: 'C4', hex: '#41CCFF', brand: 'MARD' },

    { id: 'C5', name: 'C5', hex: '#01ACEB', brand: 'MARD' },

    { id: 'C6', name: 'C6', hex: '#50AAF0', brand: 'MARD' },

    { id: 'C7', name: 'C7', hex: '#3677D2', brand: 'MARD' },

    { id: 'C8', name: 'C8', hex: '#0F54C0', brand: 'MARD' },

    { id: 'C9', name: 'C9', hex: '#324BCA', brand: 'MARD' },

    { id: 'C10', name: 'C10', hex: '#3EBCE2', brand: 'MARD' },

    { id: 'C11', name: 'C11', hex: '#28DDDE', brand: 'MARD' },

    { id: 'C12', name: 'C12', hex: '#1C334D', brand: 'MARD' },

    { id: 'C13', name: 'C13', hex: '#CDE8FF', brand: 'MARD' },

    { id: 'C14', name: 'C14', hex: '#D5FDFF', brand: 'MARD' },

    { id: 'C15', name: 'C15', hex: '#22C4C6', brand: 'MARD' },

    { id: 'C16', name: 'C16', hex: '#1557A8', brand: 'MARD' },

    { id: 'C17', name: 'C17', hex: '#04D1F6', brand: 'MARD' },

    { id: 'C18', name: 'C18', hex: '#1D3344', brand: 'MARD' },

    { id: 'C19', name: 'C19', hex: '#1887A2', brand: 'MARD' },

    { id: 'C20', name: 'C20', hex: '#176DAF', brand: 'MARD' },

    { id: 'C21', name: 'C21', hex: '#BEDDFF', brand: 'MARD' },

    { id: 'C22', name: 'C22', hex: '#67B4BE', brand: 'MARD' },

    { id: 'C23', name: 'C23', hex: '#C8E2FF', brand: 'MARD' },

    { id: 'C24', name: 'C24', hex: '#7CC4FF', brand: 'MARD' },

    { id: 'C25', name: 'C25', hex: '#A9E5E5', brand: 'MARD' },

    { id: 'C26', name: 'C26', hex: '#3CAED8', brand: 'MARD' },

    { id: 'C27', name: 'C27', hex: '#D3DFFA', brand: 'MARD' },

    { id: 'C28', name: 'C28', hex: '#BBCFED', brand: 'MARD' },

    { id: 'C29', name: 'C29', hex: '#34488E', brand: 'MARD' },

    { id: 'D1', name: 'D1', hex: '#AEB4F2', brand: 'MARD' },

    { id: 'D2', name: 'D2', hex: '#858EDD', brand: 'MARD' },

    { id: 'D3', name: 'D3', hex: '#2F54AF', brand: 'MARD' },

    { id: 'D4', name: 'D4', hex: '#182A84', brand: 'MARD' },

    { id: 'D5', name: 'D5', hex: '#B843C5', brand: 'MARD' },

    { id: 'D6', name: 'D6', hex: '#AC7BDE', brand: 'MARD' },

    { id: 'D7', name: 'D7', hex: '#8854B3', brand: 'MARD' },

    { id: 'D8', name: 'D8', hex: '#E2D3FF', brand: 'MARD' },

    { id: 'D9', name: 'D9', hex: '#D5B9F8', brand: 'MARD' },

    { id: 'D10', name: 'D10', hex: '#361851', brand: 'MARD' },

    { id: 'D11', name: 'D11', hex: '#B9BAE1', brand: 'MARD' },

    { id: 'D12', name: 'D12', hex: '#DE9AD4', brand: 'MARD' },

    { id: 'D13', name: 'D13', hex: '#B90095', brand: 'MARD' },

    { id: 'D14', name: 'D14', hex: '#8B279B', brand: 'MARD' },

    { id: 'D15', name: 'D15', hex: '#2F1F90', brand: 'MARD' },

    { id: 'D16', name: 'D16', hex: '#E3E1EE', brand: 'MARD' },

    { id: 'D17', name: 'D17', hex: '#C4D4F6', brand: 'MARD' },

    { id: 'D18', name: 'D18', hex: '#A45EC7', brand: 'MARD' },

    { id: 'D19', name: 'D19', hex: '#D8C3D7', brand: 'MARD' },

    { id: 'D20', name: 'D20', hex: '#9C32B2', brand: 'MARD' },

    { id: 'D21', name: 'D21', hex: '#9A009B', brand: 'MARD' },

    { id: 'D22', name: 'D22', hex: '#333A95', brand: 'MARD' },

    { id: 'D23', name: 'D23', hex: '#EBDAFC', brand: 'MARD' },

    { id: 'D24', name: 'D24', hex: '#7786E5', brand: 'MARD' },

    { id: 'D25', name: 'D25', hex: '#494FC7', brand: 'MARD' },

    { id: 'D26', name: 'D26', hex: '#DFC2F8', brand: 'MARD' },

    { id: 'E1', name: 'E1', hex: '#FDD3CC', brand: 'MARD' },

    { id: 'E2', name: 'E2', hex: '#FEC0DF', brand: 'MARD' },

    { id: 'E3', name: 'E3', hex: '#FFB7E7', brand: 'MARD' },

    { id: 'E4', name: 'E4', hex: '#E8649E', brand: 'MARD' },

    { id: 'E5', name: 'E5', hex: '#F551A2', brand: 'MARD' },

    { id: 'E6', name: 'E6', hex: '#F13D74', brand: 'MARD' },

    { id: 'E7', name: 'E7', hex: '#C63478', brand: 'MARD' },

    { id: 'E8', name: 'E8', hex: '#FFDBE9', brand: 'MARD' },

    { id: 'E9', name: 'E9', hex: '#E970CC', brand: 'MARD' },

    { id: 'E10', name: 'E10', hex: '#D33793', brand: 'MARD' },

    { id: 'E11', name: 'E11', hex: '#FCDDD2', brand: 'MARD' },

    { id: 'E12', name: 'E12', hex: '#F78FC3', brand: 'MARD' },

    { id: 'E13', name: 'E13', hex: '#B5006D', brand: 'MARD' },

    { id: 'E14', name: 'E14', hex: '#FFD1BA', brand: 'MARD' },

    { id: 'E15', name: 'E15', hex: '#F8C7C9', brand: 'MARD' },

    { id: 'E16', name: 'E16', hex: '#FFF3EB', brand: 'MARD' },

    { id: 'E17', name: 'E17', hex: '#FFE2EA', brand: 'MARD' },

    { id: 'E18', name: 'E18', hex: '#FFC7DB', brand: 'MARD' },

    { id: 'E19', name: 'E19', hex: '#FEBAD5', brand: 'MARD' },

    { id: 'E20', name: 'E20', hex: '#D8C7D1', brand: 'MARD' },

    { id: 'E21', name: 'E21', hex: '#BD9DA1', brand: 'MARD' },

    { id: 'E22', name: 'E22', hex: '#B785A1', brand: 'MARD' },

    { id: 'E23', name: 'E23', hex: '#937A8D', brand: 'MARD' },

    { id: 'E24', name: 'E24', hex: '#E1BCE8', brand: 'MARD' },

    { id: 'F1', name: 'F1', hex: '#FD957B', brand: 'MARD' },

    { id: 'F2', name: 'F2', hex: '#FC3D46', brand: 'MARD' },

    { id: 'F3', name: 'F3', hex: '#F74941', brand: 'MARD' },

    { id: 'F4', name: 'F4', hex: '#FC283C', brand: 'MARD' },

    { id: 'F5', name: 'F5', hex: '#E7002F', brand: 'MARD' },

    { id: 'F6', name: 'F6', hex: '#943630', brand: 'MARD' },

    { id: 'F7', name: 'F7', hex: '#971937', brand: 'MARD' },

    { id: 'F8', name: 'F8', hex: '#BC0028', brand: 'MARD' },

    { id: 'F9', name: 'F9', hex: '#E2677A', brand: 'MARD' },

    { id: 'F10', name: 'F10', hex: '#8A4526', brand: 'MARD' },

    { id: 'F11', name: 'F11', hex: '#5A2121', brand: 'MARD' },

    { id: 'F12', name: 'F12', hex: '#FD4E6A', brand: 'MARD' },

    { id: 'F13', name: 'F13', hex: '#F35744', brand: 'MARD' },

    { id: 'F14', name: 'F14', hex: '#FFA9AD', brand: 'MARD' },

    { id: 'F15', name: 'F15', hex: '#D30022', brand: 'MARD' },

    { id: 'F16', name: 'F16', hex: '#FEC2A6', brand: 'MARD' },

    { id: 'F17', name: 'F17', hex: '#E69C79', brand: 'MARD' },

    { id: 'F18', name: 'F18', hex: '#D37C46', brand: 'MARD' },

    { id: 'F19', name: 'F19', hex: '#C1444A', brand: 'MARD' },

    { id: 'F20', name: 'F20', hex: '#CD9391', brand: 'MARD' },

    { id: 'F21', name: 'F21', hex: '#F7B4C6', brand: 'MARD' },

    { id: 'F22', name: 'F22', hex: '#FDC0D0', brand: 'MARD' },

    { id: 'F23', name: 'F23', hex: '#F67E66', brand: 'MARD' },

    { id: 'F24', name: 'F24', hex: '#E698AA', brand: 'MARD' },

    { id: 'F25', name: 'F25', hex: '#E54B4F', brand: 'MARD' },

    { id: 'G1', name: 'G1', hex: '#FFE2CE', brand: 'MARD' },

    { id: 'G2', name: 'G2', hex: '#FFC4AA', brand: 'MARD' },

    { id: 'G3', name: 'G3', hex: '#F4C3A5', brand: 'MARD' },

    { id: 'G4', name: 'G4', hex: '#E1B383', brand: 'MARD' },

    { id: 'G5', name: 'G5', hex: '#EDB045', brand: 'MARD' },

    { id: 'G6', name: 'G6', hex: '#E99C17', brand: 'MARD' },

    { id: 'G7', name: 'G7', hex: '#9D5B3E', brand: 'MARD' },

    { id: 'G8', name: 'G8', hex: '#753832', brand: 'MARD' },

    { id: 'G9', name: 'G9', hex: '#E6B483', brand: 'MARD' },

    { id: 'G10', name: 'G10', hex: '#D98C39', brand: 'MARD' },

    { id: 'G11', name: 'G11', hex: '#E0C593', brand: 'MARD' },

    { id: 'G12', name: 'G12', hex: '#FFC890', brand: 'MARD' },

    { id: 'G13', name: 'G13', hex: '#B7714A', brand: 'MARD' },

    { id: 'G14', name: 'G14', hex: '#8D614C', brand: 'MARD' },

    { id: 'G15', name: 'G15', hex: '#FCF9E0', brand: 'MARD' },

    { id: 'G16', name: 'G16', hex: '#F2D9BA', brand: 'MARD' },

    { id: 'G17', name: 'G17', hex: '#78524B', brand: 'MARD' },

    { id: 'G18', name: 'G18', hex: '#FFE4CC', brand: 'MARD' },

    { id: 'G19', name: 'G19', hex: '#E07935', brand: 'MARD' },

    { id: 'G20', name: 'G20', hex: '#A94023', brand: 'MARD' },

    { id: 'G21', name: 'G21', hex: '#B88558', brand: 'MARD' },

    { id: 'H1', name: 'H1', hex: '#FDFBFF', brand: 'MARD' },

    { id: 'H2', name: 'H2', hex: '#FEFFFF', brand: 'MARD' },

    { id: 'H3', name: 'H3', hex: '#B6B1BA', brand: 'MARD' },

    { id: 'H4', name: 'H4', hex: '#89858C', brand: 'MARD' },

    { id: 'H5', name: 'H5', hex: '#48464E', brand: 'MARD' },

    { id: 'H6', name: 'H6', hex: '#2F2B2F', brand: 'MARD' },

    { id: 'H7', name: 'H7', hex: '#000000', brand: 'MARD' },

    { id: 'H8', name: 'H8', hex: '#E7D6DB', brand: 'MARD' },

    { id: 'H9', name: 'H9', hex: '#EDEDED', brand: 'MARD' },

    { id: 'H10', name: 'H10', hex: '#EEE9EA', brand: 'MARD' },

    { id: 'H11', name: 'H11', hex: '#CECDD5', brand: 'MARD' },

    { id: 'H12', name: 'H12', hex: '#FFF5ED', brand: 'MARD' },

    { id: 'H13', name: 'H13', hex: '#F5ECD2', brand: 'MARD' },

    { id: 'H14', name: 'H14', hex: '#CFD7D3', brand: 'MARD' },

    { id: 'H15', name: 'H15', hex: '#98A6A8', brand: 'MARD' },

    { id: 'H16', name: 'H16', hex: '#1D1414', brand: 'MARD' },

    { id: 'H17', name: 'H17', hex: '#F1EDED', brand: 'MARD' },

    { id: 'H18', name: 'H18', hex: '#FFFDF0', brand: 'MARD' },

    { id: 'H19', name: 'H19', hex: '#F6EFE2', brand: 'MARD' },

    { id: 'H20', name: 'H20', hex: '#949FA3', brand: 'MARD' },

    { id: 'H21', name: 'H21', hex: '#FFFBE1', brand: 'MARD' },

    { id: 'H22', name: 'H22', hex: '#CACAD4', brand: 'MARD' },

    { id: 'H23', name: 'H23', hex: '#9A9D94', brand: 'MARD' },

    { id: 'M1', name: 'M1', hex: '#BCC6B8', brand: 'MARD' },

    { id: 'M2', name: 'M2', hex: '#8AA386', brand: 'MARD' },

    { id: 'M3', name: 'M3', hex: '#697D80', brand: 'MARD' },

    { id: 'M4', name: 'M4', hex: '#E3D2BC', brand: 'MARD' },

    { id: 'M5', name: 'M5', hex: '#D0CCAA', brand: 'MARD' },

    { id: 'M6', name: 'M6', hex: '#B0A782', brand: 'MARD' },

    { id: 'M7', name: 'M7', hex: '#B4A497', brand: 'MARD' },

    { id: 'M8', name: 'M8', hex: '#B38281', brand: 'MARD' },

    { id: 'M9', name: 'M9', hex: '#A58767', brand: 'MARD' },

    { id: 'M10', name: 'M10', hex: '#C5B2BC', brand: 'MARD' },

    { id: 'M11', name: 'M11', hex: '#9F7594', brand: 'MARD' },

    { id: 'M12', name: 'M12', hex: '#644749', brand: 'MARD' },

    { id: 'M13', name: 'M13', hex: '#D19066', brand: 'MARD' },

    { id: 'M14', name: 'M14', hex: '#C77362', brand: 'MARD' },

    { id: 'M15', name: 'M15', hex: '#757D78', brand: 'MARD' },

    { id: 'P1', name: 'P1', hex: '#FCF7F8', brand: 'MARD' },

    { id: 'P2', name: 'P2', hex: '#B0A9AC', brand: 'MARD' },

    { id: 'P3', name: 'P3', hex: '#AFDCAB', brand: 'MARD' },

    { id: 'P4', name: 'P4', hex: '#FEA49F', brand: 'MARD' },

    { id: 'P5', name: 'P5', hex: '#EE8C3E', brand: 'MARD' },

    { id: 'P6', name: 'P6', hex: '#5FD0A7', brand: 'MARD' },

    { id: 'P7', name: 'P7', hex: '#EB9270', brand: 'MARD' },

    { id: 'P8', name: 'P8', hex: '#F0D958', brand: 'MARD' },

    { id: 'P9', name: 'P9', hex: '#D9D9D9', brand: 'MARD' },

    { id: 'P10', name: 'P10', hex: '#D9C7EA', brand: 'MARD' },

    { id: 'P11', name: 'P11', hex: '#F3ECC9', brand: 'MARD' },

    { id: 'P12', name: 'P12', hex: '#E6EEF2', brand: 'MARD' },

    { id: 'P13', name: 'P13', hex: '#AACBEF', brand: 'MARD' },

    { id: 'P14', name: 'P14', hex: '#337680', brand: 'MARD' },

    { id: 'P15', name: 'P15', hex: '#668575', brand: 'MARD' },

    { id: 'P16', name: 'P16', hex: '#FEBF45', brand: 'MARD' },

    { id: 'P17', name: 'P17', hex: '#FEA324', brand: 'MARD' },

    { id: 'P18', name: 'P18', hex: '#FEB89F', brand: 'MARD' },

    { id: 'P19', name: 'P19', hex: '#FFFEEC', brand: 'MARD' },

    { id: 'P20', name: 'P20', hex: '#FEBECF', brand: 'MARD' },

    { id: 'P21', name: 'P21', hex: '#ECBEBF', brand: 'MARD' },

    { id: 'P22', name: 'P22', hex: '#E4A89F', brand: 'MARD' },

    { id: 'P23', name: 'P23', hex: '#A56268', brand: 'MARD' },

    { id: 'Q1', name: 'Q1', hex: '#F2A5E8', brand: 'MARD' },

    { id: 'Q2', name: 'Q2', hex: '#E9EC91', brand: 'MARD' },

    { id: 'Q3', name: 'Q3', hex: '#FFFF00', brand: 'MARD' },

    { id: 'Q4', name: 'Q4', hex: '#FFEBFA', brand: 'MARD' },

    { id: 'Q5', name: 'Q5', hex: '#76CEDE', brand: 'MARD' },

    { id: 'R1', name: 'R1', hex: '#D50D21', brand: 'MARD' },

    { id: 'R2', name: 'R2', hex: '#F92F83', brand: 'MARD' },

    { id: 'R3', name: 'R3', hex: '#FD8324', brand: 'MARD' },

    { id: 'R4', name: 'R4', hex: '#F8EC31', brand: 'MARD' },

    { id: 'R5', name: 'R5', hex: '#35C75B', brand: 'MARD' },

    { id: 'R6', name: 'R6', hex: '#238891', brand: 'MARD' },

    { id: 'R7', name: 'R7', hex: '#19779D', brand: 'MARD' },

    { id: 'R8', name: 'R8', hex: '#1A60C3', brand: 'MARD' },

    { id: 'R9', name: 'R9', hex: '#9A56B4', brand: 'MARD' },

    { id: 'R10', name: 'R10', hex: '#FFDB4C', brand: 'MARD' },

    { id: 'R11', name: 'R11', hex: '#FFEBFA', brand: 'MARD' },

    { id: 'R12', name: 'R12', hex: '#D8D5CE', brand: 'MARD' },

    { id: 'R13', name: 'R13', hex: '#55514C', brand: 'MARD' },

    { id: 'R14', name: 'R14', hex: '#9FE4DF', brand: 'MARD' },

    { id: 'R15', name: 'R15', hex: '#77CEE9', brand: 'MARD' },

  ],

  mard291: [

    { id: 'A1', name: 'A1', hex: '#FAF4C8', brand: 'MARD' },

    { id: 'A2', name: 'A2', hex: '#FFFFD5', brand: 'MARD' },

    { id: 'A3', name: 'A3', hex: '#FEFF8B', brand: 'MARD' },

    { id: 'A4', name: 'A4', hex: '#FBED56', brand: 'MARD' },

    { id: 'A5', name: 'A5', hex: '#F4D738', brand: 'MARD' },

    { id: 'A6', name: 'A6', hex: '#FEAC4C', brand: 'MARD' },

    { id: 'A7', name: 'A7', hex: '#FE8B4C', brand: 'MARD' },

    { id: 'A8', name: 'A8', hex: '#FFDA45', brand: 'MARD' },

    { id: 'A9', name: 'A9', hex: '#FF995B', brand: 'MARD' },

    { id: 'A10', name: 'A10', hex: '#F77C31', brand: 'MARD' },

    { id: 'A11', name: 'A11', hex: '#FFDD99', brand: 'MARD' },

    { id: 'A12', name: 'A12', hex: '#FE9F72', brand: 'MARD' },

    { id: 'A13', name: 'A13', hex: '#FFC365', brand: 'MARD' },

    { id: 'A14', name: 'A14', hex: '#FD543D', brand: 'MARD' },

    { id: 'A15', name: 'A15', hex: '#FFF365', brand: 'MARD' },

    { id: 'A16', name: 'A16', hex: '#FFFF9F', brand: 'MARD' },

    { id: 'A17', name: 'A17', hex: '#FFE36E', brand: 'MARD' },

    { id: 'A18', name: 'A18', hex: '#FEBE7D', brand: 'MARD' },

    { id: 'A19', name: 'A19', hex: '#FD7C72', brand: 'MARD' },

    { id: 'A20', name: 'A20', hex: '#FFD568', brand: 'MARD' },

    { id: 'A21', name: 'A21', hex: '#FFE395', brand: 'MARD' },

    { id: 'A22', name: 'A22', hex: '#F4F57D', brand: 'MARD' },

    { id: 'A23', name: 'A23', hex: '#E6C9B7', brand: 'MARD' },

    { id: 'A24', name: 'A24', hex: '#F7F8A2', brand: 'MARD' },

    { id: 'A25', name: 'A25', hex: '#FFD67D', brand: 'MARD' },

    { id: 'A26', name: 'A26', hex: '#FFC830', brand: 'MARD' },

    { id: 'B1', name: 'B1', hex: '#E6EE31', brand: 'MARD' },

    { id: 'B2', name: 'B2', hex: '#63F347', brand: 'MARD' },

    { id: 'B3', name: 'B3', hex: '#9EF780', brand: 'MARD' },

    { id: 'B4', name: 'B4', hex: '#5DE035', brand: 'MARD' },

    { id: 'B5', name: 'B5', hex: '#35E352', brand: 'MARD' },

    { id: 'B6', name: 'B6', hex: '#65E2A6', brand: 'MARD' },

    { id: 'B7', name: 'B7', hex: '#3DAF80', brand: 'MARD' },

    { id: 'B8', name: 'B8', hex: '#1C9C4F', brand: 'MARD' },

    { id: 'B9', name: 'B9', hex: '#27523A', brand: 'MARD' },

    { id: 'B10', name: 'B10', hex: '#95D3C2', brand: 'MARD' },

    { id: 'B11', name: 'B11', hex: '#5D722A', brand: 'MARD' },

    { id: 'B12', name: 'B12', hex: '#166F41', brand: 'MARD' },

    { id: 'B13', name: 'B13', hex: '#CAEB7B', brand: 'MARD' },

    { id: 'B14', name: 'B14', hex: '#ADE946', brand: 'MARD' },

    { id: 'B15', name: 'B15', hex: '#2E5132', brand: 'MARD' },

    { id: 'B16', name: 'B16', hex: '#C5ED9C', brand: 'MARD' },

    { id: 'B17', name: 'B17', hex: '#9BB13A', brand: 'MARD' },

    { id: 'B18', name: 'B18', hex: '#E6EE49', brand: 'MARD' },

    { id: 'B19', name: 'B19', hex: '#24B88C', brand: 'MARD' },

    { id: 'B20', name: 'B20', hex: '#C2F0CC', brand: 'MARD' },

    { id: 'B21', name: 'B21', hex: '#156A6B', brand: 'MARD' },

    { id: 'B22', name: 'B22', hex: '#0B3C43', brand: 'MARD' },

    { id: 'B23', name: 'B23', hex: '#303A21', brand: 'MARD' },

    { id: 'B24', name: 'B24', hex: '#EEFCA5', brand: 'MARD' },

    { id: 'B25', name: 'B25', hex: '#4E846D', brand: 'MARD' },

    { id: 'B26', name: 'B26', hex: '#8D7A35', brand: 'MARD' },

    { id: 'B27', name: 'B27', hex: '#CCE1AF', brand: 'MARD' },

    { id: 'B28', name: 'B28', hex: '#9EE5B9', brand: 'MARD' },

    { id: 'B29', name: 'B29', hex: '#C5E254', brand: 'MARD' },

    { id: 'B30', name: 'B30', hex: '#E2FCB1', brand: 'MARD' },

    { id: 'B31', name: 'B31', hex: '#B0E792', brand: 'MARD' },

    { id: 'B32', name: 'B32', hex: '#9CAB5A', brand: 'MARD' },

    { id: 'C1', name: 'C1', hex: '#E8FFE7', brand: 'MARD' },

    { id: 'C2', name: 'C2', hex: '#A9F9FC', brand: 'MARD' },

    { id: 'C3', name: 'C3', hex: '#A0E2FB', brand: 'MARD' },

    { id: 'C4', name: 'C4', hex: '#41CCFF', brand: 'MARD' },

    { id: 'C5', name: 'C5', hex: '#01ACEB', brand: 'MARD' },

    { id: 'C6', name: 'C6', hex: '#50AAF0', brand: 'MARD' },

    { id: 'C7', name: 'C7', hex: '#3677D2', brand: 'MARD' },

    { id: 'C8', name: 'C8', hex: '#0F54C0', brand: 'MARD' },

    { id: 'C9', name: 'C9', hex: '#324BCA', brand: 'MARD' },

    { id: 'C10', name: 'C10', hex: '#3EBCE2', brand: 'MARD' },

    { id: 'C11', name: 'C11', hex: '#28DDDE', brand: 'MARD' },

    { id: 'C12', name: 'C12', hex: '#1C334D', brand: 'MARD' },

    { id: 'C13', name: 'C13', hex: '#CDE8FF', brand: 'MARD' },

    { id: 'C14', name: 'C14', hex: '#D5FDFF', brand: 'MARD' },

    { id: 'C15', name: 'C15', hex: '#22C4C6', brand: 'MARD' },

    { id: 'C16', name: 'C16', hex: '#1557A8', brand: 'MARD' },

    { id: 'C17', name: 'C17', hex: '#04D1F6', brand: 'MARD' },

    { id: 'C18', name: 'C18', hex: '#1D3344', brand: 'MARD' },

    { id: 'C19', name: 'C19', hex: '#1887A2', brand: 'MARD' },

    { id: 'C20', name: 'C20', hex: '#176DAF', brand: 'MARD' },

    { id: 'C21', name: 'C21', hex: '#BEDDFF', brand: 'MARD' },

    { id: 'C22', name: 'C22', hex: '#67B4BE', brand: 'MARD' },

    { id: 'C23', name: 'C23', hex: '#C8E2FF', brand: 'MARD' },

    { id: 'C24', name: 'C24', hex: '#7CC4FF', brand: 'MARD' },

    { id: 'C25', name: 'C25', hex: '#A9E5E5', brand: 'MARD' },

    { id: 'C26', name: 'C26', hex: '#3CAED8', brand: 'MARD' },

    { id: 'C27', name: 'C27', hex: '#D3DFFA', brand: 'MARD' },

    { id: 'C28', name: 'C28', hex: '#BBCFED', brand: 'MARD' },

    { id: 'C29', name: 'C29', hex: '#34488E', brand: 'MARD' },

    { id: 'D1', name: 'D1', hex: '#AEB4F2', brand: 'MARD' },

    { id: 'D2', name: 'D2', hex: '#858EDD', brand: 'MARD' },

    { id: 'D3', name: 'D3', hex: '#2F54AF', brand: 'MARD' },

    { id: 'D4', name: 'D4', hex: '#182A84', brand: 'MARD' },

    { id: 'D5', name: 'D5', hex: '#B843C5', brand: 'MARD' },

    { id: 'D6', name: 'D6', hex: '#AC7BDE', brand: 'MARD' },

    { id: 'D7', name: 'D7', hex: '#8854B3', brand: 'MARD' },

    { id: 'D8', name: 'D8', hex: '#E2D3FF', brand: 'MARD' },

    { id: 'D9', name: 'D9', hex: '#D5B9F8', brand: 'MARD' },

    { id: 'D10', name: 'D10', hex: '#361851', brand: 'MARD' },

    { id: 'D11', name: 'D11', hex: '#B9BAE1', brand: 'MARD' },

    { id: 'D12', name: 'D12', hex: '#DE9AD4', brand: 'MARD' },

    { id: 'D13', name: 'D13', hex: '#B90095', brand: 'MARD' },

    { id: 'D14', name: 'D14', hex: '#8B279B', brand: 'MARD' },

    { id: 'D15', name: 'D15', hex: '#2F1F90', brand: 'MARD' },

    { id: 'D16', name: 'D16', hex: '#E3E1EE', brand: 'MARD' },

    { id: 'D17', name: 'D17', hex: '#C4D4F6', brand: 'MARD' },

    { id: 'D18', name: 'D18', hex: '#A45EC7', brand: 'MARD' },

    { id: 'D19', name: 'D19', hex: '#D8C3D7', brand: 'MARD' },

    { id: 'D20', name: 'D20', hex: '#9C32B2', brand: 'MARD' },

    { id: 'D21', name: 'D21', hex: '#9A009B', brand: 'MARD' },

    { id: 'D22', name: 'D22', hex: '#333A95', brand: 'MARD' },

    { id: 'D23', name: 'D23', hex: '#EBDAFC', brand: 'MARD' },

    { id: 'D24', name: 'D24', hex: '#7786E5', brand: 'MARD' },

    { id: 'D25', name: 'D25', hex: '#494FC7', brand: 'MARD' },

    { id: 'D26', name: 'D26', hex: '#DFC2F8', brand: 'MARD' },

    { id: 'E1', name: 'E1', hex: '#FDD3CC', brand: 'MARD' },

    { id: 'E2', name: 'E2', hex: '#FEC0DF', brand: 'MARD' },

    { id: 'E3', name: 'E3', hex: '#FFB7E7', brand: 'MARD' },

    { id: 'E4', name: 'E4', hex: '#E8649E', brand: 'MARD' },

    { id: 'E5', name: 'E5', hex: '#F551A2', brand: 'MARD' },

    { id: 'E6', name: 'E6', hex: '#F13D74', brand: 'MARD' },

    { id: 'E7', name: 'E7', hex: '#C63478', brand: 'MARD' },

    { id: 'E8', name: 'E8', hex: '#FFDBE9', brand: 'MARD' },

    { id: 'E9', name: 'E9', hex: '#E970CC', brand: 'MARD' },

    { id: 'E10', name: 'E10', hex: '#D33793', brand: 'MARD' },

    { id: 'E11', name: 'E11', hex: '#FCDDD2', brand: 'MARD' },

    { id: 'E12', name: 'E12', hex: '#F78FC3', brand: 'MARD' },

    { id: 'E13', name: 'E13', hex: '#B5006D', brand: 'MARD' },

    { id: 'E14', name: 'E14', hex: '#FFD1BA', brand: 'MARD' },

    { id: 'E15', name: 'E15', hex: '#F8C7C9', brand: 'MARD' },

    { id: 'E16', name: 'E16', hex: '#FFF3EB', brand: 'MARD' },

    { id: 'E17', name: 'E17', hex: '#FFE2EA', brand: 'MARD' },

    { id: 'E18', name: 'E18', hex: '#FFC7DB', brand: 'MARD' },

    { id: 'E19', name: 'E19', hex: '#FEBAD5', brand: 'MARD' },

    { id: 'E20', name: 'E20', hex: '#D8C7D1', brand: 'MARD' },

    { id: 'E21', name: 'E21', hex: '#BD9DA1', brand: 'MARD' },

    { id: 'E22', name: 'E22', hex: '#B785A1', brand: 'MARD' },

    { id: 'E23', name: 'E23', hex: '#937A8D', brand: 'MARD' },

    { id: 'E24', name: 'E24', hex: '#E1BCE8', brand: 'MARD' },

    { id: 'F1', name: 'F1', hex: '#FD957B', brand: 'MARD' },

    { id: 'F2', name: 'F2', hex: '#FC3D46', brand: 'MARD' },

    { id: 'F3', name: 'F3', hex: '#F74941', brand: 'MARD' },

    { id: 'F4', name: 'F4', hex: '#FC283C', brand: 'MARD' },

    { id: 'F5', name: 'F5', hex: '#E7002F', brand: 'MARD' },

    { id: 'F6', name: 'F6', hex: '#943630', brand: 'MARD' },

    { id: 'F7', name: 'F7', hex: '#971937', brand: 'MARD' },

    { id: 'F8', name: 'F8', hex: '#BC0028', brand: 'MARD' },

    { id: 'F9', name: 'F9', hex: '#E2677A', brand: 'MARD' },

    { id: 'F10', name: 'F10', hex: '#8A4526', brand: 'MARD' },

    { id: 'F11', name: 'F11', hex: '#5A2121', brand: 'MARD' },

    { id: 'F12', name: 'F12', hex: '#FD4E6A', brand: 'MARD' },

    { id: 'F13', name: 'F13', hex: '#F35744', brand: 'MARD' },

    { id: 'F14', name: 'F14', hex: '#FFA9AD', brand: 'MARD' },

    { id: 'F15', name: 'F15', hex: '#D30022', brand: 'MARD' },

    { id: 'F16', name: 'F16', hex: '#FEC2A6', brand: 'MARD' },

    { id: 'F17', name: 'F17', hex: '#E69C79', brand: 'MARD' },

    { id: 'F18', name: 'F18', hex: '#D37C46', brand: 'MARD' },

    { id: 'F19', name: 'F19', hex: '#C1444A', brand: 'MARD' },

    { id: 'F20', name: 'F20', hex: '#CD9391', brand: 'MARD' },

    { id: 'F21', name: 'F21', hex: '#F7B4C6', brand: 'MARD' },

    { id: 'F22', name: 'F22', hex: '#FDC0D0', brand: 'MARD' },

    { id: 'F23', name: 'F23', hex: '#F67E66', brand: 'MARD' },

    { id: 'F24', name: 'F24', hex: '#E698AA', brand: 'MARD' },

    { id: 'F25', name: 'F25', hex: '#E54B4F', brand: 'MARD' },

    { id: 'G1', name: 'G1', hex: '#FFE2CE', brand: 'MARD' },

    { id: 'G2', name: 'G2', hex: '#FFC4AA', brand: 'MARD' },

    { id: 'G3', name: 'G3', hex: '#F4C3A5', brand: 'MARD' },

    { id: 'G4', name: 'G4', hex: '#E1B383', brand: 'MARD' },

    { id: 'G5', name: 'G5', hex: '#EDB045', brand: 'MARD' },

    { id: 'G6', name: 'G6', hex: '#E99C17', brand: 'MARD' },

    { id: 'G7', name: 'G7', hex: '#9D5B3E', brand: 'MARD' },

    { id: 'G8', name: 'G8', hex: '#753832', brand: 'MARD' },

    { id: 'G9', name: 'G9', hex: '#E6B483', brand: 'MARD' },

    { id: 'G10', name: 'G10', hex: '#D98C39', brand: 'MARD' },

    { id: 'G11', name: 'G11', hex: '#E0C593', brand: 'MARD' },

    { id: 'G12', name: 'G12', hex: '#FFC890', brand: 'MARD' },

    { id: 'G13', name: 'G13', hex: '#B7714A', brand: 'MARD' },

    { id: 'G14', name: 'G14', hex: '#8D614C', brand: 'MARD' },

    { id: 'G15', name: 'G15', hex: '#FCF9E0', brand: 'MARD' },

    { id: 'G16', name: 'G16', hex: '#F2D9BA', brand: 'MARD' },

    { id: 'G17', name: 'G17', hex: '#78524B', brand: 'MARD' },

    { id: 'G18', name: 'G18', hex: '#FFE4CC', brand: 'MARD' },

    { id: 'G19', name: 'G19', hex: '#E07935', brand: 'MARD' },

    { id: 'G20', name: 'G20', hex: '#A94023', brand: 'MARD' },

    { id: 'G21', name: 'G21', hex: '#B88558', brand: 'MARD' },

    { id: 'H1', name: 'H1', hex: '#FDFBFF', brand: 'MARD' },

    { id: 'H2', name: 'H2', hex: '#FEFFFF', brand: 'MARD' },

    { id: 'H3', name: 'H3', hex: '#B6B1BA', brand: 'MARD' },

    { id: 'H4', name: 'H4', hex: '#89858C', brand: 'MARD' },

    { id: 'H5', name: 'H5', hex: '#48464E', brand: 'MARD' },

    { id: 'H6', name: 'H6', hex: '#2F2B2F', brand: 'MARD' },

    { id: 'H7', name: 'H7', hex: '#000000', brand: 'MARD' },

    { id: 'H8', name: 'H8', hex: '#E7D6DB', brand: 'MARD' },

    { id: 'H9', name: 'H9', hex: '#EDEDED', brand: 'MARD' },

    { id: 'H10', name: 'H10', hex: '#EEE9EA', brand: 'MARD' },

    { id: 'H11', name: 'H11', hex: '#CECDD5', brand: 'MARD' },

    { id: 'H12', name: 'H12', hex: '#FFF5ED', brand: 'MARD' },

    { id: 'H13', name: 'H13', hex: '#F5ECD2', brand: 'MARD' },

    { id: 'H14', name: 'H14', hex: '#CFD7D3', brand: 'MARD' },

    { id: 'H15', name: 'H15', hex: '#98A6A8', brand: 'MARD' },

    { id: 'H16', name: 'H16', hex: '#1D1414', brand: 'MARD' },

    { id: 'H17', name: 'H17', hex: '#F1EDED', brand: 'MARD' },

    { id: 'H18', name: 'H18', hex: '#FFFDF0', brand: 'MARD' },

    { id: 'H19', name: 'H19', hex: '#F6EFE2', brand: 'MARD' },

    { id: 'H20', name: 'H20', hex: '#949FA3', brand: 'MARD' },

    { id: 'H21', name: 'H21', hex: '#FFFBE1', brand: 'MARD' },

    { id: 'H22', name: 'H22', hex: '#CACAD4', brand: 'MARD' },

    { id: 'H23', name: 'H23', hex: '#9A9D94', brand: 'MARD' },

    { id: 'M1', name: 'M1', hex: '#BCC6B8', brand: 'MARD' },

    { id: 'M2', name: 'M2', hex: '#8AA386', brand: 'MARD' },

    { id: 'M3', name: 'M3', hex: '#697D80', brand: 'MARD' },

    { id: 'M4', name: 'M4', hex: '#E3D2BC', brand: 'MARD' },

    { id: 'M5', name: 'M5', hex: '#D0CCAA', brand: 'MARD' },

    { id: 'M6', name: 'M6', hex: '#B0A782', brand: 'MARD' },

    { id: 'M7', name: 'M7', hex: '#B4A497', brand: 'MARD' },

    { id: 'M8', name: 'M8', hex: '#B38281', brand: 'MARD' },

    { id: 'M9', name: 'M9', hex: '#A58767', brand: 'MARD' },

    { id: 'M10', name: 'M10', hex: '#C5B2BC', brand: 'MARD' },

    { id: 'M11', name: 'M11', hex: '#9F7594', brand: 'MARD' },

    { id: 'M12', name: 'M12', hex: '#644749', brand: 'MARD' },

    { id: 'M13', name: 'M13', hex: '#D19066', brand: 'MARD' },

    { id: 'M14', name: 'M14', hex: '#C77362', brand: 'MARD' },

    { id: 'M15', name: 'M15', hex: '#757D78', brand: 'MARD' },

    { id: 'P1', name: 'P1', hex: '#FCF7F8', brand: 'MARD' },

    { id: 'P2', name: 'P2', hex: '#B0A9AC', brand: 'MARD' },

    { id: 'P3', name: 'P3', hex: '#AFDCAB', brand: 'MARD' },

    { id: 'P4', name: 'P4', hex: '#FEA49F', brand: 'MARD' },

    { id: 'P5', name: 'P5', hex: '#EE8C3E', brand: 'MARD' },

    { id: 'P6', name: 'P6', hex: '#5FD0A7', brand: 'MARD' },

    { id: 'P7', name: 'P7', hex: '#EB9270', brand: 'MARD' },

    { id: 'P8', name: 'P8', hex: '#F0D958', brand: 'MARD' },

    { id: 'P9', name: 'P9', hex: '#D9D9D9', brand: 'MARD' },

    { id: 'P10', name: 'P10', hex: '#D9C7EA', brand: 'MARD' },

    { id: 'P11', name: 'P11', hex: '#F3ECC9', brand: 'MARD' },

    { id: 'P12', name: 'P12', hex: '#E6EEF2', brand: 'MARD' },

    { id: 'P13', name: 'P13', hex: '#AACBEF', brand: 'MARD' },

    { id: 'P14', name: 'P14', hex: '#337680', brand: 'MARD' },

    { id: 'P15', name: 'P15', hex: '#668575', brand: 'MARD' },

    { id: 'P16', name: 'P16', hex: '#FEBF45', brand: 'MARD' },

    { id: 'P17', name: 'P17', hex: '#FEA324', brand: 'MARD' },

    { id: 'P18', name: 'P18', hex: '#FEB89F', brand: 'MARD' },

    { id: 'P19', name: 'P19', hex: '#FFFEEC', brand: 'MARD' },

    { id: 'P20', name: 'P20', hex: '#FEBECF', brand: 'MARD' },

    { id: 'P21', name: 'P21', hex: '#ECBEBF', brand: 'MARD' },

    { id: 'P22', name: 'P22', hex: '#E4A89F', brand: 'MARD' },

    { id: 'P23', name: 'P23', hex: '#A56268', brand: 'MARD' },

    { id: 'Q1', name: 'Q1', hex: '#F2A5E8', brand: 'MARD' },

    { id: 'Q2', name: 'Q2', hex: '#E9EC91', brand: 'MARD' },

    { id: 'Q3', name: 'Q3', hex: '#FFFF00', brand: 'MARD' },

    { id: 'Q4', name: 'Q4', hex: '#FFEBFA', brand: 'MARD' },

    { id: 'Q5', name: 'Q5', hex: '#76CEDE', brand: 'MARD' },

    { id: 'R1', name: 'R1', hex: '#D50D21', brand: 'MARD' },

    { id: 'R2', name: 'R2', hex: '#F92F83', brand: 'MARD' },

    { id: 'R3', name: 'R3', hex: '#FD8324', brand: 'MARD' },

    { id: 'R4', name: 'R4', hex: '#F8EC31', brand: 'MARD' },

    { id: 'R5', name: 'R5', hex: '#35C75B', brand: 'MARD' },

    { id: 'R6', name: 'R6', hex: '#238891', brand: 'MARD' },

    { id: 'R7', name: 'R7', hex: '#19779D', brand: 'MARD' },

    { id: 'R8', name: 'R8', hex: '#1A60C3', brand: 'MARD' },

    { id: 'R9', name: 'R9', hex: '#9A56B4', brand: 'MARD' },

    { id: 'R10', name: 'R10', hex: '#FFDB4C', brand: 'MARD' },

    { id: 'R11', name: 'R11', hex: '#FFEBFA', brand: 'MARD' },

    { id: 'R12', name: 'R12', hex: '#D8D5CE', brand: 'MARD' },

    { id: 'R13', name: 'R13', hex: '#55514C', brand: 'MARD' },

    { id: 'R14', name: 'R14', hex: '#9FE4DF', brand: 'MARD' },

    { id: 'R15', name: 'R15', hex: '#77CEE9', brand: 'MARD' },

    { id: 'R16', name: 'R16', hex: '#3ECFCA', brand: 'MARD' },

    { id: 'R17', name: 'R17', hex: '#4A867A', brand: 'MARD' },

    { id: 'R18', name: 'R18', hex: '#7FCD9D', brand: 'MARD' },

    { id: 'R19', name: 'R19', hex: '#CDE55D', brand: 'MARD' },

    { id: 'R20', name: 'R20', hex: '#E8C7B4', brand: 'MARD' },

    { id: 'R21', name: 'R21', hex: '#AD6F3C', brand: 'MARD' },

    { id: 'R22', name: 'R22', hex: '#6C372F', brand: 'MARD' },

    { id: 'R23', name: 'R23', hex: '#FEB872', brand: 'MARD' },

    { id: 'R24', name: 'R24', hex: '#F3C1C0', brand: 'MARD' },

    { id: 'R25', name: 'R25', hex: '#C9675E', brand: 'MARD' },

    { id: 'R26', name: 'R26', hex: '#D293BE', brand: 'MARD' },

    { id: 'R27', name: 'R27', hex: '#EA8CB1', brand: 'MARD' },

    { id: 'R28', name: 'R28', hex: '#9C87D6', brand: 'MARD' },

    { id: 'T1', name: 'T1', hex: '#FFFFFF', brand: 'MARD' },

    { id: 'Y1', name: 'Y1', hex: '#FD6FB4', brand: 'MARD' },

    { id: 'Y2', name: 'Y2', hex: '#FEB481', brand: 'MARD' },

    { id: 'Y3', name: 'Y3', hex: '#D7FAA0', brand: 'MARD' },

    { id: 'Y4', name: 'Y4', hex: '#8BDBFA', brand: 'MARD' },

    { id: 'Y5', name: 'Y5', hex: '#E987EA', brand: 'MARD' },

    { id: 'ZG1', name: 'ZG1', hex: '#DAABB3', brand: 'MARD' },

    { id: 'ZG2', name: 'ZG2', hex: '#D6AA87', brand: 'MARD' },

    { id: 'ZG3', name: 'ZG3', hex: '#C1BD8D', brand: 'MARD' },

    { id: 'ZG4', name: 'ZG4', hex: '#96869F', brand: 'MARD' },

    { id: 'ZG5', name: 'ZG5', hex: '#8490A6', brand: 'MARD' },

    { id: 'ZG6', name: 'ZG6', hex: '#94BFE2', brand: 'MARD' },

    { id: 'ZG7', name: 'ZG7', hex: '#E2A9D2', brand: 'MARD' },

    { id: 'ZG8', name: 'ZG8', hex: '#AB91C0', brand: 'MARD' },

  ],

  coco: [

    { id: 'E02', name: 'E02', hex: '#FAF4C8', brand: 'COCO' },

    { id: 'E01', name: 'E01', hex: '#FFFFD5', brand: 'COCO' },

    { id: 'E05', name: 'E05', hex: '#FEFF8B', brand: 'COCO' },

    { id: 'E07', name: 'E07', hex: '#FBED56', brand: 'COCO' },

    { id: 'D03', name: 'D03', hex: '#F4D738', brand: 'COCO' },

    { id: 'D05', name: 'D05', hex: '#FEAC4C', brand: 'COCO' },

    { id: 'D08', name: 'D08', hex: '#FE8B4C', brand: 'COCO' },

    { id: 'E08', name: 'E08', hex: '#FFDA45', brand: 'COCO' },

    { id: 'D06', name: 'D06', hex: '#FF995B', brand: 'COCO' },

    { id: 'D07', name: 'D07', hex: '#F77C31', brand: 'COCO' },

    { id: 'D01', name: 'D01', hex: '#FFDD99', brand: 'COCO' },

    { id: 'K09', name: 'K09', hex: '#FE9F72', brand: 'COCO' },

    { id: 'D04', name: 'D04', hex: '#FFC365', brand: 'COCO' },

    { id: 'C05', name: 'C05', hex: '#FD543D', brand: 'COCO' },

    { id: 'E04', name: 'E04', hex: '#FFF365', brand: 'COCO' },

    { id: 'E03', name: 'E03', hex: '#FFFF9F', brand: 'COCO' },

    { id: 'E06', name: 'E06', hex: '#FFE36E', brand: 'COCO' },

    { id: 'D02', name: 'D02', hex: '#FEBE7D', brand: 'COCO' },

    { id: 'K10', name: 'K10', hex: '#FD7C72', brand: 'COCO' },

    { id: 'E09', name: 'E09', hex: '#FFD568', brand: 'COCO' },

    { id: 'E10', name: 'E10', hex: '#FFE395', brand: 'COCO' },

    { id: 'E11', name: 'E11', hex: '#F4F57D', brand: 'COCO' },

    { id: 'E12', name: 'E12', hex: '#E6C9B7', brand: 'COCO' },

    { id: 'E13', name: 'E13', hex: '#F7F8A2', brand: 'COCO' },

    { id: 'E14', name: 'E14', hex: '#FFD67D', brand: 'COCO' },

    { id: 'E15', name: 'E15', hex: '#FFC830', brand: 'COCO' },

    { id: 'F05', name: 'F05', hex: '#E6EE31', brand: 'COCO' },

    { id: 'F08', name: 'F08', hex: '#63F347', brand: 'COCO' },

    { id: 'F04', name: 'F04', hex: '#9EF780', brand: 'COCO' },

    { id: 'F09', name: 'F09', hex: '#5DE035', brand: 'COCO' },

    { id: 'F10', name: 'F10', hex: '#35E352', brand: 'COCO' },

    { id: 'G04', name: 'G04', hex: '#65E2A6', brand: 'COCO' },

    { id: 'G05', name: 'G05', hex: '#3DAF80', brand: 'COCO' },

    { id: 'F11', name: 'F11', hex: '#1C9C4F', brand: 'COCO' },

    { id: 'F16', name: 'F16', hex: '#27523A', brand: 'COCO' },

    { id: 'G03', name: 'G03', hex: '#95D3C2', brand: 'COCO' },

    { id: 'F14', name: 'F14', hex: '#5D722A', brand: 'COCO' },

    { id: 'F12', name: 'F12', hex: '#166F41', brand: 'COCO' },

    { id: 'F02', name: 'F02', hex: '#CAEB7B', brand: 'COCO' },

    { id: 'F06', name: 'F06', hex: '#ADE946', brand: 'COCO' },

    { id: 'F15', name: 'F15', hex: '#2E5132', brand: 'COCO' },

    { id: 'F03', name: 'F03', hex: '#C5ED9C', brand: 'COCO' },

    { id: 'F13', name: 'F13', hex: '#9BB13A', brand: 'COCO' },

    { id: 'F07', name: 'F07', hex: '#E6EE49', brand: 'COCO' },

    { id: 'G06', name: 'G06', hex: '#24B88C', brand: 'COCO' },

    { id: 'G02', name: 'G02', hex: '#C2F0CC', brand: 'COCO' },

    { id: 'G07', name: 'G07', hex: '#156A6B', brand: 'COCO' },

    { id: 'G08', name: 'G08', hex: '#0B3C43', brand: 'COCO' },

    { id: 'F17', name: 'F17', hex: '#303A21', brand: 'COCO' },

    { id: 'F01', name: 'F01', hex: '#EEFCA5', brand: 'COCO' },

    { id: 'F18', name: 'F18', hex: '#4E846D', brand: 'COCO' },

    { id: 'F19', name: 'F19', hex: '#8D7A35', brand: 'COCO' },

    { id: 'F20', name: 'F20', hex: '#CCE1AF', brand: 'COCO' },

    { id: 'F21', name: 'F21', hex: '#9EE5B9', brand: 'COCO' },

    { id: 'F22', name: 'F22', hex: '#C5E254', brand: 'COCO' },

    { id: 'F23', name: 'F23', hex: '#E2FCB1', brand: 'COCO' },

    { id: 'F24', name: 'F24', hex: '#B0E792', brand: 'COCO' },

    { id: 'F25', name: 'F25', hex: '#9CAB5A', brand: 'COCO' },

    { id: 'G01', name: 'G01', hex: '#E8FFE7', brand: 'COCO' },

    { id: 'H03', name: 'H03', hex: '#A9F9FC', brand: 'COCO' },

    { id: 'H04', name: 'H04', hex: '#A0E2FB', brand: 'COCO' },

    { id: 'H05', name: 'H05', hex: '#41CCFF', brand: 'COCO' },

    { id: 'H07', name: 'H07', hex: '#01ACEB', brand: 'COCO' },

    { id: 'H08', name: 'H08', hex: '#50AAF0', brand: 'COCO' },

    { id: 'H13', name: 'H13', hex: '#3677D2', brand: 'COCO' },

    { id: 'H14', name: 'H14', hex: '#0F54C0', brand: 'COCO' },

    { id: 'H16', name: 'H16', hex: '#324BCA', brand: 'COCO' },

    { id: 'H09', name: 'H09', hex: '#3EBCE2', brand: 'COCO' },

    { id: 'H10', name: 'H10', hex: '#28DDDE', brand: 'COCO' },

    { id: 'H23', name: 'H23', hex: '#1C334D', brand: 'COCO' },

    { id: 'H01', name: 'H01', hex: '#CDE8FF', brand: 'COCO' },

    { id: 'H02', name: 'H02', hex: '#D5FDFF', brand: 'COCO' },

    { id: 'H11', name: 'H11', hex: '#22C4C6', brand: 'COCO' },

    { id: 'H18', name: 'H18', hex: '#1557A8', brand: 'COCO' },

    { id: 'H19', name: 'H19', hex: '#04D1F6', brand: 'COCO' },

    { id: 'H24', name: 'H24', hex: '#1D3344', brand: 'COCO' },

    { id: 'H12', name: 'H12', hex: '#1887A2', brand: 'COCO' },

    { id: 'H17', name: 'H17', hex: '#176DAF', brand: 'COCO' },

    { id: 'H06', name: 'H06', hex: '#BEDDFF', brand: 'COCO' },

    { id: 'H25', name: 'H25', hex: '#67B4BE', brand: 'COCO' },

    { id: 'H26', name: 'H26', hex: '#C8E2FF', brand: 'COCO' },

    { id: 'H27', name: 'H27', hex: '#7CC4FF', brand: 'COCO' },

    { id: 'H28', name: 'H28', hex: '#A9E5E5', brand: 'COCO' },

    { id: 'H29', name: 'H29', hex: '#3CAED8', brand: 'COCO' },

    { id: 'H30', name: 'H30', hex: '#D3DFFA', brand: 'COCO' },

    { id: 'H31', name: 'H31', hex: '#BBCFED', brand: 'COCO' },

    { id: 'H32', name: 'H32', hex: '#34488E', brand: 'COCO' },

    { id: 'J07', name: 'J07', hex: '#AEB4F2', brand: 'COCO' },

    { id: 'J08', name: 'J08', hex: '#858EDD', brand: 'COCO' },

    { id: 'H15', name: 'H15', hex: '#2F54AF', brand: 'COCO' },

    { id: 'H20', name: 'H20', hex: '#182A84', brand: 'COCO' },

    { id: 'J12', name: 'J12', hex: '#B843C5', brand: 'COCO' },

    { id: 'J11', name: 'J11', hex: '#AC7BDE', brand: 'COCO' },

    { id: 'J15', name: 'J15', hex: '#8854B3', brand: 'COCO' },

    { id: 'J03', name: 'J03', hex: '#E2D3FF', brand: 'COCO' },

    { id: 'J04', name: 'J04', hex: '#D5B9F8', brand: 'COCO' },

    { id: 'J19', name: 'J19', hex: '#361851', brand: 'COCO' },

    { id: 'J06', name: 'J06', hex: '#B9BAE1', brand: 'COCO' },

    { id: 'J10', name: 'J10', hex: '#DE9AD4', brand: 'COCO' },

    { id: 'J14', name: 'J14', hex: '#B90095', brand: 'COCO' },

    { id: 'J16', name: 'J16', hex: '#8B279B', brand: 'COCO' },

    { id: 'H22', name: 'H22', hex: '#2F1F90', brand: 'COCO' },

    { id: 'J01', name: 'J01', hex: '#E3E1EE', brand: 'COCO' },

    { id: 'J05', name: 'J05', hex: '#C4D4F6', brand: 'COCO' },

    { id: 'J13', name: 'J13', hex: '#A45EC7', brand: 'COCO' },

    { id: 'J09', name: 'J09', hex: '#D8C3D7', brand: 'COCO' },

    { id: 'J17', name: 'J17', hex: '#9C32B2', brand: 'COCO' },

    { id: 'J18', name: 'J18', hex: '#9A009B', brand: 'COCO' },

    { id: 'H21', name: 'H21', hex: '#333A95', brand: 'COCO' },

    { id: 'J02', name: 'J02', hex: '#EBDAFC', brand: 'COCO' },

    { id: 'J20', name: 'J20', hex: '#7786E5', brand: 'COCO' },

    { id: 'J21', name: 'J21', hex: '#494FC7', brand: 'COCO' },

    { id: 'J22', name: 'J22', hex: '#DFC2F8', brand: 'COCO' },

    { id: 'K03', name: 'K03', hex: '#FDD3CC', brand: 'COCO' },

    { id: 'K15', name: 'K15', hex: '#FEC0DF', brand: 'COCO' },

    { id: 'K17', name: 'K17', hex: '#FFB7E7', brand: 'COCO' },

    { id: 'K21', name: 'K21', hex: '#E8649E', brand: 'COCO' },

    { id: 'K19', name: 'K19', hex: '#F551A2', brand: 'COCO' },

    { id: 'K22', name: 'K22', hex: '#F13D74', brand: 'COCO' },

    { id: 'K25', name: 'K25', hex: '#C63478', brand: 'COCO' },

    { id: 'K12', name: 'K12', hex: '#FFDBE9', brand: 'COCO' },

    { id: 'K18', name: 'K18', hex: '#E970CC', brand: 'COCO' },

    { id: 'K23', name: 'K23', hex: '#D33793', brand: 'COCO' },

    { id: 'K02', name: 'K02', hex: '#FCDDD2', brand: 'COCO' },

    { id: 'K16', name: 'K16', hex: '#F78FC3', brand: 'COCO' },

    { id: 'K24', name: 'K24', hex: '#B5006D', brand: 'COCO' },

    { id: 'K05', name: 'K05', hex: '#FFD1BA', brand: 'COCO' },

    { id: 'K04', name: 'K04', hex: '#F8C7C9', brand: 'COCO' },

    { id: 'K01', name: 'K01', hex: '#FFF3EB', brand: 'COCO' },

    { id: 'K11', name: 'K11', hex: '#FFE2EA', brand: 'COCO' },

    { id: 'K13', name: 'K13', hex: '#FFC7DB', brand: 'COCO' },

    { id: 'K14', name: 'K14', hex: '#FEBAD5', brand: 'COCO' },

    { id: 'K26', name: 'K26', hex: '#D8C7D1', brand: 'COCO' },

    { id: 'K27', name: 'K27', hex: '#BD9DA1', brand: 'COCO' },

    { id: 'K28', name: 'K28', hex: '#B785A1', brand: 'COCO' },

    { id: 'K29', name: 'K29', hex: '#937A8D', brand: 'COCO' },

    { id: 'K30', name: 'K30', hex: '#E1BCE8', brand: 'COCO' },

    { id: 'K08', name: 'K08', hex: '#FD957B', brand: 'COCO' },

    { id: 'C02', name: 'C02', hex: '#FC3D46', brand: 'COCO' },

    { id: 'C03', name: 'C03', hex: '#F74941', brand: 'COCO' },

    { id: 'C06', name: 'C06', hex: '#FC283C', brand: 'COCO' },

    { id: 'C07', name: 'C07', hex: '#E7002F', brand: 'COCO' },

    { id: 'Z21', name: 'Z21', hex: '#943630', brand: 'COCO' },

    { id: 'C10', name: 'C10', hex: '#971937', brand: 'COCO' },

    { id: 'C09', name: 'C09', hex: '#BC0028', brand: 'COCO' },

    { id: 'K20', name: 'K20', hex: '#E2677A', brand: 'COCO' },

    { id: 'Z20', name: 'Z20', hex: '#8A4526', brand: 'COCO' },

    { id: 'Z23', name: 'Z23', hex: '#5A2121', brand: 'COCO' },

    { id: 'C01', name: 'C01', hex: '#FD4E6A', brand: 'COCO' },

    { id: 'C04', name: 'C04', hex: '#F35744', brand: 'COCO' },

    { id: 'K07', name: 'K07', hex: '#FFA9AD', brand: 'COCO' },

    { id: 'C08', name: 'C08', hex: '#D30022', brand: 'COCO' },

    { id: 'K06', name: 'K06', hex: '#FEC2A6', brand: 'COCO' },

    { id: 'K31', name: 'K31', hex: '#E69C79', brand: 'COCO' },

    { id: 'K32', name: 'K32', hex: '#D37C46', brand: 'COCO' },

    { id: 'K33', name: 'K33', hex: '#C1444A', brand: 'COCO' },

    { id: 'K34', name: 'K34', hex: '#CD9391', brand: 'COCO' },

    { id: 'K35', name: 'K35', hex: '#F7B4C6', brand: 'COCO' },

    { id: 'K36', name: 'K36', hex: '#FDC0D0', brand: 'COCO' },

    { id: 'K37', name: 'K37', hex: '#F67E66', brand: 'COCO' },

    { id: 'K38', name: 'K38', hex: '#E698AA', brand: 'COCO' },

    { id: 'K39', name: 'K39', hex: '#E54B4F', brand: 'COCO' },

    { id: 'Z02', name: 'Z02', hex: '#FFE2CE', brand: 'COCO' },

    { id: 'Z05', name: 'Z05', hex: '#FFC4AA', brand: 'COCO' },

    { id: 'Z06', name: 'Z06', hex: '#F4C3A5', brand: 'COCO' },

    { id: 'Z08', name: 'Z08', hex: '#E1B383', brand: 'COCO' },

    { id: 'Z10', name: 'Z10', hex: '#EDB045', brand: 'COCO' },

    { id: 'Z11', name: 'Z11', hex: '#E99C17', brand: 'COCO' },

    { id: 'Z18', name: 'Z18', hex: '#9D5B3E', brand: 'COCO' },

    { id: 'Z22', name: 'Z22', hex: '#753832', brand: 'COCO' },

    { id: 'Z09', name: 'Z09', hex: '#E6B483', brand: 'COCO' },

    { id: 'Z15', name: 'Z15', hex: '#D98C39', brand: 'COCO' },

    { id: 'Z07', name: 'Z07', hex: '#E0C593', brand: 'COCO' },

    { id: 'Z13', name: 'Z13', hex: '#FFC890', brand: 'COCO' },

    { id: 'Z14', name: 'Z14', hex: '#B7714A', brand: 'COCO' },

    { id: 'Z17', name: 'Z17', hex: '#8D614C', brand: 'COCO' },

    { id: 'Z03', name: 'Z03', hex: '#FCF9E0', brand: 'COCO' },

    { id: 'Z04', name: 'Z04', hex: '#F2D9BA', brand: 'COCO' },

    { id: 'Z16', name: 'Z16', hex: '#78524B', brand: 'COCO' },

    { id: 'Z01', name: 'Z01', hex: '#FFE4CC', brand: 'COCO' },

    { id: 'Z12', name: 'Z12', hex: '#E07935', brand: 'COCO' },

    { id: 'Z19', name: 'Z19', hex: '#A94023', brand: 'COCO' },

    { id: 'Z24', name: 'Z24', hex: '#B88558', brand: 'COCO' },

    { id: 'A02', name: 'A02', hex: '#FDFBFF', brand: 'COCO' },

    { id: 'A01', name: 'A01', hex: '#FEFFFF', brand: 'COCO' },

    { id: 'B03', name: 'B03', hex: '#B6B1BA', brand: 'COCO' },

    { id: 'B05', name: 'B05', hex: '#89858C', brand: 'COCO' },

    { id: 'B06', name: 'B06', hex: '#48464E', brand: 'COCO' },

    { id: 'B07', name: 'B07', hex: '#2F2B2F', brand: 'COCO' },

    { id: 'B09', name: 'B09', hex: '#000000', brand: 'COCO' },

    { id: 'A09', name: 'A09', hex: '#E7D6DB', brand: 'COCO' },

    { id: 'A08', name: 'A08', hex: '#EDEDED', brand: 'COCO' },

    { id: 'A10', name: 'A10', hex: '#EEE9EA', brand: 'COCO' },

    { id: 'B01', name: 'B01', hex: '#CECDD5', brand: 'COCO' },

    { id: 'A04', name: 'A04', hex: '#FFF5ED', brand: 'COCO' },

    { id: 'A06', name: 'A06', hex: '#F5ECD2', brand: 'COCO' },

    { id: 'B02', name: 'B02', hex: '#CFD7D3', brand: 'COCO' },

    { id: 'B04', name: 'B04', hex: '#98A6A8', brand: 'COCO' },

    { id: 'B08', name: 'B08', hex: '#1D1414', brand: 'COCO' },

    { id: 'A07', name: 'A07', hex: '#F1EDED', brand: 'COCO' },

    { id: 'A03', name: 'A03', hex: '#FFFDF0', brand: 'COCO' },

    { id: 'A05', name: 'A05', hex: '#F6EFE2', brand: 'COCO' },

    { id: 'B10', name: 'B10', hex: '#949FA3', brand: 'COCO' },

    { id: 'A11', name: 'A11', hex: '#FFFBE1', brand: 'COCO' },

    { id: 'A12', name: 'A12', hex: '#CACAD4', brand: 'COCO' },

    { id: 'B11', name: 'B11', hex: '#9A9D94', brand: 'COCO' },

    { id: 'Y01', name: 'Y01', hex: '#BCC6B8', brand: 'COCO' },

    { id: 'Y02', name: 'Y02', hex: '#8AA386', brand: 'COCO' },

    { id: 'Y03', name: 'Y03', hex: '#697D80', brand: 'COCO' },

    { id: 'Y04', name: 'Y04', hex: '#E3D2BC', brand: 'COCO' },

    { id: 'Y05', name: 'Y05', hex: '#D0CCAA', brand: 'COCO' },

    { id: 'Y06', name: 'Y06', hex: '#B0A782', brand: 'COCO' },

    { id: 'Y07', name: 'Y07', hex: '#B4A497', brand: 'COCO' },

    { id: 'Y08', name: 'Y08', hex: '#B38281', brand: 'COCO' },

    { id: 'Y09', name: 'Y09', hex: '#A58767', brand: 'COCO' },

    { id: 'Y10', name: 'Y10', hex: '#C5B2BC', brand: 'COCO' },

    { id: 'Y11', name: 'Y11', hex: '#9F7594', brand: 'COCO' },

    { id: 'Y12', name: 'Y12', hex: '#644749', brand: 'COCO' },

    { id: 'Y13', name: 'Y13', hex: '#D19066', brand: 'COCO' },

    { id: 'Y14', name: 'Y14', hex: '#C77362', brand: 'COCO' },

    { id: 'Y15', name: 'Y15', hex: '#757D78', brand: 'COCO' },

    { id: 'M01', name: 'M01', hex: '#FCF7F8', brand: 'COCO' },

    { id: 'M02', name: 'M02', hex: '#B0A9AC', brand: 'COCO' },

    { id: 'M03', name: 'M03', hex: '#AFDCAB', brand: 'COCO' },

    { id: 'M04', name: 'M04', hex: '#FEA49F', brand: 'COCO' },

    { id: 'M05', name: 'M05', hex: '#EE8C3E', brand: 'COCO' },

    { id: 'M06', name: 'M06', hex: '#5FD0A7', brand: 'COCO' },

    { id: 'M07', name: 'M07', hex: '#EB9270', brand: 'COCO' },

    { id: 'M08', name: 'M08', hex: '#F0D958', brand: 'COCO' },

    { id: 'M09', name: 'M09', hex: '#D9D9D9', brand: 'COCO' },

    { id: 'M10', name: 'M10', hex: '#D9C7EA', brand: 'COCO' },

    { id: 'M11', name: 'M11', hex: '#F3ECC9', brand: 'COCO' },

    { id: 'M12', name: 'M12', hex: '#E6EEF2', brand: 'COCO' },

    { id: 'M13', name: 'M13', hex: '#AACBEF', brand: 'COCO' },

    { id: 'M14', name: 'M14', hex: '#337680', brand: 'COCO' },

    { id: 'M15', name: 'M15', hex: '#668575', brand: 'COCO' },

    { id: 'M16', name: 'M16', hex: '#FEBF45', brand: 'COCO' },

    { id: 'M17', name: 'M17', hex: '#FEA324', brand: 'COCO' },

    { id: 'M18', name: 'M18', hex: '#FEB89F', brand: 'COCO' },

    { id: 'M19', name: 'M19', hex: '#FFFEEC', brand: 'COCO' },

    { id: 'M21', name: 'M21', hex: '#FEBECF', brand: 'COCO' },

    { id: 'M20', name: 'M20', hex: '#ECBEBF', brand: 'COCO' },

    { id: 'M22', name: 'M22', hex: '#E4A89F', brand: 'COCO' },

    { id: 'M23', name: 'M23', hex: '#A56268', brand: 'COCO' },

    { id: 'W3', name: 'W3', hex: '#F2A5E8', brand: 'COCO' },

    { id: 'W4', name: 'W4', hex: '#E9EC91', brand: 'COCO' },

    { id: 'W1', name: 'W1', hex: '#FFFF00', brand: 'COCO' },

    { id: 'W2', name: 'W2', hex: '#FFEBFA', brand: 'COCO' },

    { id: 'W5', name: 'W5', hex: '#76CEDE', brand: 'COCO' },

    { id: 'L01', name: 'L01', hex: '#D50D21', brand: 'COCO' },

    { id: 'L02', name: 'L02', hex: '#F92F83', brand: 'COCO' },

    { id: 'L03', name: 'L03', hex: '#FD8324', brand: 'COCO' },

    { id: 'L04', name: 'L04', hex: '#F8EC31', brand: 'COCO' },

    { id: 'L05', name: 'L05', hex: '#35C75B', brand: 'COCO' },

    { id: 'L06', name: 'L06', hex: '#238891', brand: 'COCO' },

    { id: 'L07', name: 'L07', hex: '#19779D', brand: 'COCO' },

    { id: 'L08', name: 'L08', hex: '#1A60C3', brand: 'COCO' },

    { id: 'L09', name: 'L09', hex: '#9A56B4', brand: 'COCO' },

    { id: 'L10', name: 'L10', hex: '#FFDB4C', brand: 'COCO' },

    { id: 'L11', name: 'L11', hex: '#FFEBFB', brand: 'COCO' },

    { id: 'L12', name: 'L12', hex: '#D8D5CE', brand: 'COCO' },

    { id: 'L13', name: 'L13', hex: '#55514C', brand: 'COCO' },

    { id: 'S1', name: 'S1', hex: '#9FE4DF', brand: 'COCO' },

    { id: 'S2', name: 'S2', hex: '#77CEE9', brand: 'COCO' },

    { id: 'S3', name: 'S3', hex: '#3ECFCA', brand: 'COCO' },

    { id: 'S4', name: 'S4', hex: '#4A867A', brand: 'COCO' },

    { id: 'S5', name: 'S5', hex: '#7FCD9D', brand: 'COCO' },

    { id: 'S6', name: 'S6', hex: '#CDE55D', brand: 'COCO' },

    { id: 'S7', name: 'S7', hex: '#E8C7B4', brand: 'COCO' },

    { id: 'S8', name: 'S8', hex: '#AD6F3C', brand: 'COCO' },

    { id: 'S9', name: 'S9', hex: '#6C372F', brand: 'COCO' },

    { id: 'S10', name: 'S10', hex: '#FEB872', brand: 'COCO' },

    { id: 'S11', name: 'S11', hex: '#F3C1C0', brand: 'COCO' },

    { id: 'S12', name: 'S12', hex: '#C9675E', brand: 'COCO' },

    { id: 'S13', name: 'S13', hex: '#D293BE', brand: 'COCO' },

    { id: 'S14', name: 'S14', hex: '#EA8CB1', brand: 'COCO' },

    { id: 'S15', name: 'S15', hex: '#9C87D6', brand: 'COCO' },

    { id: 'L14', name: 'L14', hex: '#FFFFFF', brand: 'COCO' },

    { id: 'N01', name: 'N01', hex: '#FD6FB4', brand: 'COCO' },

    { id: 'N02', name: 'N02', hex: '#FEB481', brand: 'COCO' },

    { id: 'N03', name: 'N03', hex: '#D7FAA0', brand: 'COCO' },

    { id: 'N04', name: 'N04', hex: '#8BDBFA', brand: 'COCO' },

    { id: 'N05', name: 'N05', hex: '#E987EA', brand: 'COCO' },

    { id: 'GB1', name: 'GB1', hex: '#DAABB3', brand: 'COCO' },

    { id: 'GB2', name: 'GB2', hex: '#D6AA87', brand: 'COCO' },

    { id: 'GB3', name: 'GB3', hex: '#C1BD8D', brand: 'COCO' },

    { id: 'GB4', name: 'GB4', hex: '#96869F', brand: 'COCO' },

    { id: 'GB5', name: 'GB5', hex: '#8490A6', brand: 'COCO' },

    { id: 'GB6', name: 'GB6', hex: '#94BFE2', brand: 'COCO' },

    { id: 'GB7', name: 'GB7', hex: '#E2A9D2', brand: 'COCO' },

    { id: 'GB8', name: 'GB8', hex: '#AB91C0', brand: 'COCO' },

  ],

  manman: [

    { id: 'E2', name: 'E2', hex: '#FAF4C8', brand: '漫漫' },

    { id: 'B1', name: 'B1', hex: '#FFFFD5', brand: '漫漫' },

    { id: 'B2', name: 'B2', hex: '#FEFF8B', brand: '漫漫' },

    { id: 'B3', name: 'B3', hex: '#FBED56', brand: '漫漫' },

    { id: 'B4', name: 'B4', hex: '#F4D738', brand: '漫漫' },

    { id: 'B5', name: 'B5', hex: '#FEAC4C', brand: '漫漫' },

    { id: 'B6', name: 'B6', hex: '#FE8B4C', brand: '漫漫' },

    { id: 'B10', name: 'B10', hex: '#FFDA45', brand: '漫漫' },

    { id: 'B11', name: 'B11', hex: '#FF995B', brand: '漫漫' },

    { id: 'B12', name: 'B12', hex: '#F77C31', brand: '漫漫' },

    { id: 'E11', name: 'E11', hex: '#FFDD99', brand: '漫漫' },

    { id: 'A18', name: 'A18', hex: '#FE9F72', brand: '漫漫' },

    { id: 'B13', name: 'B13', hex: '#FFC365', brand: '漫漫' },

    { id: 'B14', name: 'B14', hex: '#FD543D', brand: '漫漫' },

    { id: 'B15', name: 'B15', hex: '#FFF365', brand: '漫漫' },

    { id: 'IC04', name: 'IC04', hex: '#FFFF9F', brand: '漫漫' },

    { id: 'IC9', name: 'IC9', hex: '#FFE36E', brand: '漫漫' },

    { id: 'IC14', name: 'IC14', hex: '#FEBE7D', brand: '漫漫' },

    { id: 'IC15', name: 'IC15', hex: '#FD7C72', brand: '漫漫' },

    { id: 'Q6', name: 'Q6', hex: '#FFD568', brand: '漫漫' },

    { id: 'R07', name: 'R07', hex: '#FFE395', brand: '漫漫' },

    { id: 'R06', name: 'R06', hex: '#F4F57D', brand: '漫漫' },

    { id: 'R08', name: 'R08', hex: '#E6C9B7', brand: '漫漫' },

    { id: 'G3', name: 'G3', hex: '#F7F8A2', brand: '漫漫' },

    { id: 'G4', name: 'G4', hex: '#FFD67D', brand: '漫漫' },

    { id: 'G5', name: 'G5', hex: '#FFC830', brand: '漫漫' },

    { id: 'C1', name: 'C1', hex: '#E6EE31', brand: '漫漫' },

    { id: 'C2', name: 'C2', hex: '#63F347', brand: '漫漫' },

    { id: 'C7', name: 'C7', hex: '#9EF780', brand: '漫漫' },

    { id: 'C3', name: 'C3', hex: '#5DE035', brand: '漫漫' },

    { id: 'C4', name: 'C4', hex: '#35E352', brand: '漫漫' },

    { id: 'C9', name: 'C9', hex: '#65E2A6', brand: '漫漫' },

    { id: 'C10', name: 'C10', hex: '#3DAF80', brand: '漫漫' },

    { id: 'C5', name: 'C5', hex: '#1C9C4F', brand: '漫漫' },

    { id: 'C6', name: 'C6', hex: '#27523A', brand: '漫漫' },

    { id: 'C11', name: 'C11', hex: '#95D3C2', brand: '漫漫' },

    { id: 'C12', name: 'C12', hex: '#5D722A', brand: '漫漫' },

    { id: 'C13', name: 'C13', hex: '#166F41', brand: '漫漫' },

    { id: 'C14', name: 'C14', hex: '#CAEB7B', brand: '漫漫' },

    { id: 'C15', name: 'C15', hex: '#ADE946', brand: '漫漫' },

    { id: 'C16', name: 'C16', hex: '#2E5132', brand: '漫漫' },

    { id: 'C17', name: 'C17', hex: '#C5ED9C', brand: '漫漫' },

    { id: 'C18', name: 'C18', hex: '#9BB13A', brand: '漫漫' },

    { id: 'C19', name: 'C19', hex: '#E6EE49', brand: '漫漫' },

    { id: 'DH15', name: 'DH15', hex: '#24B88C', brand: '漫漫' },

    { id: 'DH10', name: 'DH10', hex: '#C2F0CC', brand: '漫漫' },

    { id: 'DH2', name: 'DH2', hex: '#156A6B', brand: '漫漫' },

    { id: 'DH7', name: 'DH7', hex: '#0B3C43', brand: '漫漫' },

    { id: 'DH12', name: 'DH12', hex: '#303A21', brand: '漫漫' },

    { id: 'IC5', name: 'IC5', hex: '#EEFCA5', brand: '漫漫' },

    { id: 'Q13', name: 'Q13', hex: '#4E846D', brand: '漫漫' },

    { id: 'Q7', name: 'Q7', hex: '#8D7A35', brand: '漫漫' },

    { id: 'R10', name: 'R10', hex: '#CCE1AF', brand: '漫漫' },

    { id: 'R11', name: 'R11', hex: '#9EE5B9', brand: '漫漫' },

    { id: 'R09', name: 'R09', hex: '#C5E254', brand: '漫漫' },

    { id: 'G6', name: 'G6', hex: '#E2FCB1', brand: '漫漫' },

    { id: 'G7', name: 'G7', hex: '#B0E792', brand: '漫漫' },

    { id: 'G12', name: 'G12', hex: '#9CAB5A', brand: '漫漫' },

    { id: 'C8', name: 'C8', hex: '#E8FFE7', brand: '漫漫' },

    { id: 'D1', name: 'D1', hex: '#A9F9FC', brand: '漫漫' },

    { id: 'D2', name: 'D2', hex: '#A0E2FB', brand: '漫漫' },

    { id: 'D3', name: 'D3', hex: '#41CCFF', brand: '漫漫' },

    { id: 'D7', name: 'D7', hex: '#01ACEB', brand: '漫漫' },

    { id: 'D4', name: 'D4', hex: '#50AAF0', brand: '漫漫' },

    { id: 'D8', name: 'D8', hex: '#3677D2', brand: '漫漫' },

    { id: 'D9', name: 'D9', hex: '#0F54C0', brand: '漫漫' },

    { id: 'N5', name: 'N5', hex: '#324BCA', brand: '漫漫' },

    { id: 'D25', name: 'D25', hex: '#3EBCE2', brand: '漫漫' },

    { id: 'D28', name: 'D28', hex: '#28DDDE', brand: '漫漫' },

    { id: 'D26', name: 'D26', hex: '#1C334D', brand: '漫漫' },

    { id: 'D30', name: 'D30', hex: '#CDE8FF', brand: '漫漫' },

    { id: 'D29', name: 'D29', hex: '#D5FDFF', brand: '漫漫' },

    { id: 'D31', name: 'D31', hex: '#22C4C6', brand: '漫漫' },

    { id: 'D32', name: 'D32', hex: '#1557A8', brand: '漫漫' },

    { id: 'D36', name: 'D36', hex: '#04D1F6', brand: '漫漫' },

    { id: 'DH6', name: 'DH6', hex: '#1D3344', brand: '漫漫' },

    { id: 'DH9', name: 'DH9', hex: '#1887A2', brand: '漫漫' },

    { id: 'DH14', name: 'DH14', hex: '#176DAF', brand: '漫漫' },

    { id: 'IC3', name: 'IC3', hex: '#BEDDFF', brand: '漫漫' },

    { id: 'Q11', name: 'Q11', hex: '#67B4BE', brand: '漫漫' },

    { id: 'R13', name: 'R13', hex: '#C8E2FF', brand: '漫漫' },

    { id: 'R14', name: 'R14', hex: '#7CC4FF', brand: '漫漫' },

    { id: 'R12', name: 'R12', hex: '#A9E5E5', brand: '漫漫' },

    { id: 'R15', name: 'R15', hex: '#3CAED8', brand: '漫漫' },

    { id: 'G13', name: 'G13', hex: '#D3DFFA', brand: '漫漫' },

    { id: 'G14', name: 'G14', hex: '#BBCFED', brand: '漫漫' },

    { id: 'G15', name: 'G15', hex: '#34488E', brand: '漫漫' },

    { id: 'D5', name: 'D5', hex: '#AEB4F2', brand: '漫漫' },

    { id: 'D6', name: 'D6', hex: '#858EDD', brand: '漫漫' },

    { id: 'D10', name: 'D10', hex: '#2F54AF', brand: '漫漫' },

    { id: 'D11', name: 'D11', hex: '#182A84', brand: '漫漫' },

    { id: 'D13', name: 'D13', hex: '#B843C5', brand: '漫漫' },

    { id: 'D14', name: 'D14', hex: '#AC7BDE', brand: '漫漫' },

    { id: 'D12', name: 'D12', hex: '#8854B3', brand: '漫漫' },

    { id: 'D16', name: 'D16', hex: '#E2D3FF', brand: '漫漫' },

    { id: 'D17', name: 'D17', hex: '#D5B9F8', brand: '漫漫' },

    { id: 'D15', name: 'D15', hex: '#361851', brand: '漫漫' },

    { id: 'D19', name: 'D19', hex: '#B9BAE1', brand: '漫漫' },

    { id: 'D20', name: 'D20', hex: '#DE9AD4', brand: '漫漫' },

    { id: 'D21', name: 'D21', hex: '#B90095', brand: '漫漫' },

    { id: 'D22', name: 'D22', hex: '#8B279B', brand: '漫漫' },

    { id: 'D18', name: 'D18', hex: '#2F1F90', brand: '漫漫' },

    { id: 'D23', name: 'D23', hex: '#E3E1EE', brand: '漫漫' },

    { id: 'D24', name: 'D24', hex: '#C4D4F6', brand: '漫漫' },

    { id: 'D27', name: 'D27', hex: '#A45EC7', brand: '漫漫' },

    { id: 'D33', name: 'D33', hex: '#D8C3D7', brand: '漫漫' },

    { id: 'D34', name: 'D34', hex: '#9C32B2', brand: '漫漫' },

    { id: 'D35', name: 'D35', hex: '#9A009B', brand: '漫漫' },

    { id: 'DH1', name: 'DH1', hex: '#333A95', brand: '漫漫' },

    { id: 'IC8', name: 'IC8', hex: '#EBDAFC', brand: '漫漫' },

    { id: 'Q14', name: 'Q14', hex: '#7786E5', brand: '漫漫' },

    { id: 'Q15', name: 'Q15', hex: '#494FC7', brand: '漫漫' },

    { id: 'R01', name: 'R01', hex: '#DFC2F8', brand: '漫漫' },

    { id: 'E1', name: 'E1', hex: '#FDD3CC', brand: '漫漫' },

    { id: 'A7', name: 'A7', hex: '#FEC0DF', brand: '漫漫' },

    { id: 'A8', name: 'A8', hex: '#FFB7E7', brand: '漫漫' },

    { id: 'A9', name: 'A9', hex: '#E8649E', brand: '漫漫' },

    { id: 'A10', name: 'A10', hex: '#F551A2', brand: '漫漫' },

    { id: 'A11', name: 'A11', hex: '#F13D74', brand: '漫漫' },

    { id: 'A12', name: 'A12', hex: '#C63478', brand: '漫漫' },

    { id: 'A13', name: 'A13', hex: '#FFDBE9', brand: '漫漫' },

    { id: 'A14', name: 'A14', hex: '#E970CC', brand: '漫漫' },

    { id: 'A16', name: 'A16', hex: '#D33793', brand: '漫漫' },

    { id: 'A19', name: 'A19', hex: '#FCDDD2', brand: '漫漫' },

    { id: 'A20', name: 'A20', hex: '#F78FC3', brand: '漫漫' },

    { id: 'A21', name: 'A21', hex: '#B5006D', brand: '漫漫' },

    { id: 'E21', name: 'E21', hex: '#FFD1BA', brand: '漫漫' },

    { id: 'A23', name: 'A23', hex: '#F8C7C9', brand: '漫漫' },

    { id: 'IC2', name: 'IC2', hex: '#FFF3EB', brand: '漫漫' },

    { id: 'IC7', name: 'IC7', hex: '#FFE2EA', brand: '漫漫' },

    { id: 'IC13', name: 'IC13', hex: '#FFC7DB', brand: '漫漫' },

    { id: 'IC12', name: 'IC12', hex: '#FEBAD5', brand: '漫漫' },

    { id: 'Q1', name: 'Q1', hex: '#D8C7D1', brand: '漫漫' },

    { id: 'Q2', name: 'Q2', hex: '#BD9DA1', brand: '漫漫' },

    { id: 'Q4', name: 'Q4', hex: '#B785A1', brand: '漫漫' },

    { id: 'Q3', name: 'Q3', hex: '#937A8D', brand: '漫漫' },

    { id: 'G8', name: 'G8', hex: '#E1BCE8', brand: '漫漫' },

    { id: 'A1', name: 'A1', hex: '#FD957B', brand: '漫漫' },

    { id: 'A2', name: 'A2', hex: '#FC3D46', brand: '漫漫' },

    { id: 'A3', name: 'A3', hex: '#F74941', brand: '漫漫' },

    { id: 'A4', name: 'A4', hex: '#FC283C', brand: '漫漫' },

    { id: 'A5', name: 'A5', hex: '#E7002F', brand: '漫漫' },

    { id: 'E9', name: 'E9', hex: '#943630', brand: '漫漫' },

    { id: 'A6', name: 'A6', hex: '#971937', brand: '漫漫' },

    { id: 'A17', name: 'A17', hex: '#BC0028', brand: '漫漫' },

    { id: 'A15', name: 'A15', hex: '#E2677A', brand: '漫漫' },

    { id: 'E15', name: 'E15', hex: '#8A4526', brand: '漫漫' },

    { id: 'E16', name: 'E16', hex: '#5A2121', brand: '漫漫' },

    { id: 'A22', name: 'A22', hex: '#FD4E6A', brand: '漫漫' },

    { id: 'A24', name: 'A24', hex: '#F35744', brand: '漫漫' },

    { id: 'A25', name: 'A25', hex: '#FFA9AD', brand: '漫漫' },

    { id: 'DH8', name: 'DH8', hex: '#D30022', brand: '漫漫' },

    { id: 'IC10', name: 'IC10', hex: '#FEC2A6', brand: '漫漫' },

    { id: 'Q9', name: 'Q9', hex: '#E69C79', brand: '漫漫' },

    { id: 'Q10', name: 'Q10', hex: '#D37C46', brand: '漫漫' },

    { id: 'Q05', name: 'Q05', hex: '#C1444A', brand: '漫漫' },

    { id: 'R04', name: 'R04', hex: '#CD9391', brand: '漫漫' },

    { id: 'R03', name: 'R03', hex: '#F7B4C6', brand: '漫漫' },

    { id: 'R02', name: 'R02', hex: '#FDC0D0', brand: '漫漫' },

    { id: 'R05', name: 'R05', hex: '#F67E66', brand: '漫漫' },

    { id: 'G9', name: 'G9', hex: '#E698AA', brand: '漫漫' },

    { id: 'G10', name: 'G10', hex: '#E54B4F', brand: '漫漫' },

    { id: 'E3', name: 'E3', hex: '#FFE2CE', brand: '漫漫' },

    { id: 'E4', name: 'E4', hex: '#FFC4AA', brand: '漫漫' },

    { id: 'E5', name: 'E5', hex: '#F4C3A5', brand: '漫漫' },

    { id: 'E6', name: 'E6', hex: '#E1B383', brand: '漫漫' },

    { id: 'B7', name: 'B7', hex: '#EDB045', brand: '漫漫' },

    { id: 'B8', name: 'B8', hex: '#E99C17', brand: '漫漫' },

    { id: 'E7', name: 'E7', hex: '#9D5B3E', brand: '漫漫' },

    { id: 'E8', name: 'E8', hex: '#753832', brand: '漫漫' },

    { id: 'E10', name: 'E10', hex: '#E6B483', brand: '漫漫' },

    { id: 'B9', name: 'B9', hex: '#D98C39', brand: '漫漫' },

    { id: 'E12', name: 'E12', hex: '#E0C593', brand: '漫漫' },

    { id: 'E13', name: 'E13', hex: '#FFC890', brand: '漫漫' },

    { id: 'E17', name: 'E17', hex: '#B7714A', brand: '漫漫' },

    { id: 'E14', name: 'E14', hex: '#8D614C', brand: '漫漫' },

    { id: 'E19', name: 'E19', hex: '#FCF9E0', brand: '漫漫' },

    { id: 'E20', name: 'E20', hex: '#F2D9BA', brand: '漫漫' },

    { id: 'E22', name: 'E22', hex: '#78524B', brand: '漫漫' },

    { id: 'DH5', name: 'DH5', hex: '#FFE4CC', brand: '漫漫' },

    { id: 'DH3', name: 'DH3', hex: '#E07935', brand: '漫漫' },

    { id: 'DH13', name: 'DH13', hex: '#A94023', brand: '漫漫' },

    { id: 'Q8', name: 'Q8', hex: '#B88558', brand: '漫漫' },

    { id: 'F1', name: 'F1', hex: '#FDFBFF', brand: '漫漫' },

    { id: 'F2', name: 'F2', hex: '#FEFFFF', brand: '漫漫' },

    { id: 'F3', name: 'F3', hex: '#B6B1BA', brand: '漫漫' },

    { id: 'F4', name: 'F4', hex: '#89858C', brand: '漫漫' },

    { id: 'F5', name: 'F5', hex: '#48464E', brand: '漫漫' },

    { id: 'F6', name: 'F6', hex: '#2F2B2F', brand: '漫漫' },

    { id: 'F7', name: 'F7', hex: '#000000', brand: '漫漫' },

    { id: 'F8', name: 'F8', hex: '#E7D6DB', brand: '漫漫' },

    { id: 'F10', name: 'F10', hex: '#EDEDED', brand: '漫漫' },

    { id: 'F9', name: 'F9', hex: '#EEE9EA', brand: '漫漫' },

    { id: 'F11', name: 'F11', hex: '#CECDD5', brand: '漫漫' },

    { id: 'E18', name: 'E18', hex: '#FFF5ED', brand: '漫漫' },

    { id: 'E23', name: 'E23', hex: '#F5ECD2', brand: '漫漫' },

    { id: 'F12', name: 'F12', hex: '#CFD7D3', brand: '漫漫' },

    { id: 'DH4', name: 'DH4', hex: '#98A6A8', brand: '漫漫' },

    { id: 'DH11', name: 'DH11', hex: '#1D1414', brand: '漫漫' },

    { id: 'IC6', name: 'IC6', hex: '#F1EDED', brand: '漫漫' },

    { id: 'IC1', name: 'IC1', hex: '#FFFDF0', brand: '漫漫' },

    { id: 'IC11', name: 'IC11', hex: '#F6EFE2', brand: '漫漫' },

    { id: 'Q12', name: 'Q12', hex: '#949FA3', brand: '漫漫' },

    { id: 'G1', name: 'G1', hex: '#FFFBE1', brand: '漫漫' },

    { id: 'G2', name: 'G2', hex: '#CACAD4', brand: '漫漫' },

    { id: 'G11', name: 'G11', hex: '#9A9D94', brand: '漫漫' },

    { id: 'YX11', name: 'YX11', hex: '#BCC6B8', brand: '漫漫' },

    { id: 'YX12', name: 'YX12', hex: '#8AA386', brand: '漫漫' },

    { id: 'YX2', name: 'YX2', hex: '#697D80', brand: '漫漫' },

    { id: 'YX15', name: 'YX15', hex: '#E3D2BC', brand: '漫漫' },

    { id: 'YX6', name: 'YX6', hex: '#D0CCAA', brand: '漫漫' },

    { id: 'YX1', name: 'YX1', hex: '#B0A782', brand: '漫漫' },

    { id: 'YX13', name: 'YX13', hex: '#B4A497', brand: '漫漫' },

    { id: 'YX14', name: 'YX14', hex: '#B38281', brand: '漫漫' },

    { id: 'YX10', name: 'YX10', hex: '#A58767', brand: '漫漫' },

    { id: 'YX9', name: 'YX9', hex: '#C5B2BC', brand: '漫漫' },

    { id: 'YX4', name: 'YX4', hex: '#9F7594', brand: '漫漫' },

    { id: 'YX5', name: 'YX5', hex: '#644749', brand: '漫漫' },

    { id: 'YX8', name: 'YX8', hex: '#D19066', brand: '漫漫' },

    { id: 'YX3', name: 'YX3', hex: '#C77362', brand: '漫漫' },

    { id: 'YX7', name: 'YX7', hex: '#757D78', brand: '漫漫' },

    { id: 'P1', name: 'P1', hex: '#FCF7F8', brand: '漫漫' },

    { id: 'P2', name: 'P2', hex: '#B0A9AC', brand: '漫漫' },

    { id: 'P4', name: 'P4', hex: '#AFDCAB', brand: '漫漫' },

    { id: 'P5', name: 'P5', hex: '#FEA49F', brand: '漫漫' },

    { id: 'P3', name: 'P3', hex: '#EE8C3E', brand: '漫漫' },

    { id: 'P8', name: 'P8', hex: '#5FD0A7', brand: '漫漫' },

    { id: 'P6', name: 'P6', hex: '#EB9270', brand: '漫漫' },

    { id: 'P7', name: 'P7', hex: '#F0D958', brand: '漫漫' },

    { id: 'P13', name: 'P13', hex: '#D9D9D9', brand: '漫漫' },

    { id: 'P18', name: 'P18', hex: '#D9C7EA', brand: '漫漫' },

    { id: 'P9', name: 'P9', hex: '#F3ECC9', brand: '漫漫' },

    { id: 'P12', name: 'P12', hex: '#E6EEF2', brand: '漫漫' },

    { id: 'P17', name: 'P17', hex: '#AACBEF', brand: '漫漫' },

    { id: 'P22', name: 'P22', hex: '#337680', brand: '漫漫' },

    { id: 'P23', name: 'P23', hex: '#668575', brand: '漫漫' },

    { id: 'P14', name: 'P14', hex: '#FEBF45', brand: '漫漫' },

    { id: 'P19', name: 'P19', hex: '#FEA324', brand: '漫漫' },

    { id: 'P11', name: 'P11', hex: '#FEB89F', brand: '漫漫' },

    { id: 'P10', name: 'P10', hex: '#FFFEEC', brand: '漫漫' },

    { id: 'P15', name: 'P15', hex: '#FEBECF', brand: '漫漫' },

    { id: 'P20', name: 'P20', hex: '#ECBEBF', brand: '漫漫' },

    { id: 'P16', name: 'P16', hex: '#E4A89F', brand: '漫漫' },

    { id: 'P21', name: 'P21', hex: '#A56268', brand: '漫漫' },

    { id: 'W3', name: 'W3', hex: '#F2A5E8', brand: '漫漫' },

    { id: 'W4', name: 'W4', hex: '#E9EC91', brand: '漫漫' },

    { id: 'W1', name: 'W1', hex: '#FFFF00', brand: '漫漫' },

    { id: 'W2', name: 'W2', hex: '#FFEBFA', brand: '漫漫' },

    { id: 'W5', name: 'W5', hex: '#76CEDE', brand: '漫漫' },

    { id: 'T1', name: 'T1', hex: '#D50D21', brand: '漫漫' },

    { id: 'N1', name: 'N1', hex: '#F92F83', brand: '漫漫' },

    { id: 'N2', name: 'N2', hex: '#FD8324', brand: '漫漫' },

    { id: 'N3', name: 'N3', hex: '#F8EC31', brand: '漫漫' },

    { id: 'N4', name: 'N4', hex: '#35C75B', brand: '漫漫' },

    { id: 'T4', name: 'T4', hex: '#238891', brand: '漫漫' },

    { id: 'T5', name: 'T5', hex: '#19779D', brand: '漫漫' },

    { id: 'T3', name: 'T3', hex: '#1A60C3', brand: '漫漫' },

    { id: 'T2', name: 'T2', hex: '#9A56B4', brand: '漫漫' },

    { id: 'L2', name: 'L2', hex: '#FFDB4C', brand: '漫漫' },

    { id: 'T6', name: 'T6', hex: '#FFEBFB', brand: '漫漫' },

    { id: 'T7', name: 'T7', hex: '#D8D5CE', brand: '漫漫' },

    { id: '-', name: '-', hex: '#55514C', brand: '漫漫' },

    { id: 'S1', name: 'S1', hex: '#9FE4DF', brand: '漫漫' },

    { id: 'S2', name: 'S2', hex: '#77CEE9', brand: '漫漫' },

    { id: 'S3', name: 'S3', hex: '#3ECFCA', brand: '漫漫' },

    { id: 'S5', name: 'S5', hex: '#4A867A', brand: '漫漫' },

    { id: 'S4', name: 'S4', hex: '#7FCD9D', brand: '漫漫' },

    { id: 'S11', name: 'S11', hex: '#CDE55D', brand: '漫漫' },

    { id: 'S6', name: 'S6', hex: '#E8C7B4', brand: '漫漫' },

    { id: 'S13', name: 'S13', hex: '#AD6F3C', brand: '漫漫' },

    { id: 'S15', name: 'S15', hex: '#6C372F', brand: '漫漫' },

    { id: 'S12', name: 'S12', hex: '#FEB872', brand: '漫漫' },

    { id: 'S4', name: 'S4', hex: '#F3C1C0', brand: '漫漫' },

    { id: 'S14', name: 'S14', hex: '#C9675E', brand: '漫漫' },

    { id: 'S9', name: 'S9', hex: '#D293BE', brand: '漫漫' },

    { id: 'S8', name: 'S8', hex: '#EA8CB1', brand: '漫漫' },

    { id: 'S10', name: 'S10', hex: '#9C87D6', brand: '漫漫' },

    { id: 'L6', name: 'L6', hex: '#FFFFFF', brand: '漫漫' },

    { id: 'Y1', name: 'Y1', hex: '#FD6FB4', brand: '漫漫' },

    { id: 'Y2', name: 'Y2', hex: '#FEB481', brand: '漫漫' },

    { id: 'Y3', name: 'Y3', hex: '#D7FAA0', brand: '漫漫' },

    { id: 'Y4', name: 'Y4', hex: '#8BDBFA', brand: '漫漫' },

    { id: 'Y5', name: 'Y5', hex: '#E987EA', brand: '漫漫' },

    { id: 'ZG1', name: 'ZG1', hex: '#DAABB3', brand: '漫漫' },

    { id: 'ZG2', name: 'ZG2', hex: '#D6AA87', brand: '漫漫' },

    { id: 'ZG3', name: 'ZG3', hex: '#C1BD8D', brand: '漫漫' },

    { id: 'ZG4', name: 'ZG4', hex: '#96869F', brand: '漫漫' },

    { id: 'ZG5', name: 'ZG5', hex: '#8490A6', brand: '漫漫' },

    { id: 'ZG6', name: 'ZG6', hex: '#94BFE2', brand: '漫漫' },

    { id: 'ZG7', name: 'ZG7', hex: '#E2A9D2', brand: '漫漫' },

    { id: 'ZG8', name: 'ZG8', hex: '#AB91C0', brand: '漫漫' },

  ],

  panpan: [

    { id: '65', name: '65', hex: '#FAF4C8', brand: '盼盼' },

    { id: '2', name: '2', hex: '#FFFFD5', brand: '盼盼' },

    { id: '28', name: '28', hex: '#FEFF8B', brand: '盼盼' },

    { id: '3', name: '3', hex: '#FBED56', brand: '盼盼' },

    { id: '74', name: '74', hex: '#F4D738', brand: '盼盼' },

    { id: '29', name: '29', hex: '#FEAC4C', brand: '盼盼' },

    { id: '4', name: '4', hex: '#FE8B4C', brand: '盼盼' },

    { id: '88', name: '88', hex: '#FFDA45', brand: '盼盼' },

    { id: '90', name: '90', hex: '#FF995B', brand: '盼盼' },

    { id: '89', name: '89', hex: '#F77C31', brand: '盼盼' },

    { id: '100', name: '100', hex: '#FFDD99', brand: '盼盼' },

    { id: '99', name: '99', hex: '#FE9F72', brand: '盼盼' },

    { id: '131', name: '131', hex: '#FFC365', brand: '盼盼' },

    { id: '138', name: '138', hex: '#FD543D', brand: '盼盼' },

    { id: '150', name: '150', hex: '#FFF365', brand: '盼盼' },

    { id: '216', name: '216', hex: '#FFFF9F', brand: '盼盼' },

    { id: '213', name: '213', hex: '#FFE36E', brand: '盼盼' },

    { id: '223', name: '223', hex: '#FEBE7D', brand: '盼盼' },

    { id: '218', name: '218', hex: '#FD7C72', brand: '盼盼' },

    { id: '242', name: '242', hex: '#FFD568', brand: '盼盼' },

    { id: '276', name: '276', hex: '#FFE395', brand: '盼盼' },

    { id: '270', name: '270', hex: '#F4F57D', brand: '盼盼' },

    { id: '274', name: '274', hex: '#E6C9B7', brand: '盼盼' },

    { id: '288', name: '288', hex: '#F7F8A2', brand: '盼盼' },

    { id: '289', name: '289', hex: '#FFD67D', brand: '盼盼' },

    { id: '290', name: '290', hex: '#FFC830', brand: '盼盼' },

    { id: '48', name: '48', hex: '#E6EE31', brand: '盼盼' },

    { id: '33', name: '33', hex: '#63F347', brand: '盼盼' },

    { id: '26', name: '26', hex: '#9EF780', brand: '盼盼' },

    { id: '66', name: '66', hex: '#5DE035', brand: '盼盼' },

    { id: '39', name: '39', hex: '#35E352', brand: '盼盼' },

    { id: '11', name: '11', hex: '#65E2A6', brand: '盼盼' },

    { id: '44', name: '44', hex: '#3DAF80', brand: '盼盼' },

    { id: '10', name: '10', hex: '#1C9C4F', brand: '盼盼' },

    { id: '79', name: '79', hex: '#27523A', brand: '盼盼' },

    { id: '96', name: '96', hex: '#95D3C2', brand: '盼盼' },

    { id: '97', name: '97', hex: '#5D722A', brand: '盼盼' },

    { id: '106', name: '106', hex: '#166F41', brand: '盼盼' },

    { id: '128', name: '128', hex: '#CAEB7B', brand: '盼盼' },

    { id: '129', name: '129', hex: '#ADE946', brand: '盼盼' },

    { id: '130', name: '130', hex: '#2E5132', brand: '盼盼' },

    { id: '141', name: '141', hex: '#C5ED9C', brand: '盼盼' },

    { id: '142', name: '142', hex: '#9BB13A', brand: '盼盼' },

    { id: '147', name: '147', hex: '#E6EE49', brand: '盼盼' },

    { id: '191', name: '191', hex: '#24B88C', brand: '盼盼' },

    { id: '192', name: '192', hex: '#C2F0CC', brand: '盼盼' },

    { id: '207', name: '207', hex: '#156A6B', brand: '盼盼' },

    { id: '206', name: '206', hex: '#0B3C43', brand: '盼盼' },

    { id: '205', name: '205', hex: '#303A21', brand: '盼盼' },

    { id: '222', name: '222', hex: '#EEFCA5', brand: '盼盼' },

    { id: '240', name: '240', hex: '#4E846D', brand: '盼盼' },

    { id: '248', name: '248', hex: '#8D7A35', brand: '盼盼' },

    { id: '262', name: '262', hex: '#CCE1AF', brand: '盼盼' },

    { id: '269', name: '269', hex: '#9EE5B9', brand: '盼盼' },

    { id: '268', name: '268', hex: '#C5E254', brand: '盼盼' },

    { id: '285', name: '285', hex: '#E2FCB1', brand: '盼盼' },

    { id: '286', name: '286', hex: '#B0E792', brand: '盼盼' },

    { id: '287', name: '287', hex: '#9CAB5A', brand: '盼盼' },

    { id: '64', name: '64', hex: '#E8FFE7', brand: '盼盼' },

    { id: '30', name: '30', hex: '#A9F9FC', brand: '盼盼' },

    { id: '63', name: '63', hex: '#A0E2FB', brand: '盼盼' },

    { id: '77', name: '77', hex: '#41CCFF', brand: '盼盼' },

    { id: '34', name: '34', hex: '#01ACEB', brand: '盼盼' },

    { id: '25', name: '25', hex: '#50AAF0', brand: '盼盼' },

    { id: '9', name: '9', hex: '#3677D2', brand: '盼盼' },

    { id: '52', name: '52', hex: '#0F54C0', brand: '盼盼' },

    { id: '42', name: '42', hex: '#324BCA', brand: '盼盼' },

    { id: '121', name: '121', hex: '#3EBCE2', brand: '盼盼' },

    { id: '122', name: '122', hex: '#28DDDE', brand: '盼盼' },

    { id: '120', name: '120', hex: '#1C334D', brand: '盼盼' },

    { id: '140', name: '140', hex: '#CDE8FF', brand: '盼盼' },

    { id: '139', name: '139', hex: '#D5FDFF', brand: '盼盼' },

    { id: '143', name: '143', hex: '#22C4C6', brand: '盼盼' },

    { id: '149', name: '149', hex: '#1557A8', brand: '盼盼' },

    { id: '163', name: '163', hex: '#04D1F6', brand: '盼盼' },

    { id: '196', name: '196', hex: '#1D3344', brand: '盼盼' },

    { id: '202', name: '202', hex: '#1887A2', brand: '盼盼' },

    { id: '197', name: '197', hex: '#176DAF', brand: '盼盼' },

    { id: '212', name: '212', hex: '#BEDDFF', brand: '盼盼' },

    { id: '239', name: '239', hex: '#67B4BE', brand: '盼盼' },

    { id: '263', name: '263', hex: '#C8E2FF', brand: '盼盼' },

    { id: '267', name: '267', hex: '#7CC4FF', brand: '盼盼' },

    { id: '271', name: '271', hex: '#A9E5E5', brand: '盼盼' },

    { id: '265', name: '265', hex: '#3CAED8', brand: '盼盼' },

    { id: '279', name: '279', hex: '#D3DFFA', brand: '盼盼' },

    { id: '280', name: '280', hex: '#BBCFED', brand: '盼盼' },

    { id: '281', name: '281', hex: '#34488E', brand: '盼盼' },

    { id: '46', name: '46', hex: '#AEB4F2', brand: '盼盼' },

    { id: '36', name: '36', hex: '#858EDD', brand: '盼盼' },

    { id: '8', name: '8', hex: '#2F54AF', brand: '盼盼' },

    { id: '75', name: '75', hex: '#182A84', brand: '盼盼' },

    { id: '32', name: '32', hex: '#B843C5', brand: '盼盼' },

    { id: '27', name: '27', hex: '#AC7BDE', brand: '盼盼' },

    { id: '7', name: '7', hex: '#8854B3', brand: '盼盼' },

    { id: '94', name: '94', hex: '#E2D3FF', brand: '盼盼' },

    { id: '93', name: '93', hex: '#D5B9F8', brand: '盼盼' },

    { id: '92', name: '92', hex: '#361851', brand: '盼盼' },

    { id: '105', name: '105', hex: '#B9BAE1', brand: '盼盼' },

    { id: '104', name: '104', hex: '#DE9AD4', brand: '盼盼' },

    { id: '103', name: '103', hex: '#B90095', brand: '盼盼' },

    { id: '102', name: '102', hex: '#8B279B', brand: '盼盼' },

    { id: '101', name: '101', hex: '#2F1F90', brand: '盼盼' },

    { id: '118', name: '118', hex: '#E3E1EE', brand: '盼盼' },

    { id: '119', name: '119', hex: '#C4D4F6', brand: '盼盼' },

    { id: '124', name: '124', hex: '#A45EC7', brand: '盼盼' },

    { id: '153', name: '153', hex: '#D8C3D7', brand: '盼盼' },

    { id: '161', name: '161', hex: '#9C32B2', brand: '盼盼' },

    { id: '162', name: '162', hex: '#9A009B', brand: '盼盼' },

    { id: '198', name: '198', hex: '#333A95', brand: '盼盼' },

    { id: '217', name: '217', hex: '#EBDAFC', brand: '盼盼' },

    { id: '244', name: '244', hex: '#7786E5', brand: '盼盼' },

    { id: '249', name: '249', hex: '#494FC7', brand: '盼盼' },

    { id: '273', name: '273', hex: '#DFC2F8', brand: '盼盼' },

    { id: '18', name: '18', hex: '#FDD3CC', brand: '盼盼' },

    { id: '38', name: '38', hex: '#FEC0DF', brand: '盼盼' },

    { id: '62', name: '62', hex: '#FFB7E7', brand: '盼盼' },

    { id: '6', name: '6', hex: '#E8649E', brand: '盼盼' },

    { id: '40', name: '40', hex: '#F551A2', brand: '盼盼' },

    { id: '20', name: '20', hex: '#F13D74', brand: '盼盼' },

    { id: '41', name: '41', hex: '#C63478', brand: '盼盼' },

    { id: '84', name: '84', hex: '#FFDBE9', brand: '盼盼' },

    { id: '98', name: '98', hex: '#E970CC', brand: '盼盼' },

    { id: '83', name: '83', hex: '#D33793', brand: '盼盼' },

    { id: '125', name: '125', hex: '#FCDDD2', brand: '盼盼' },

    { id: '126', name: '126', hex: '#F78FC3', brand: '盼盼' },

    { id: '127', name: '127', hex: '#B5006D', brand: '盼盼' },

    { id: '137', name: '137', hex: '#FFD1BA', brand: '盼盼' },

    { id: '135', name: '135', hex: '#F8C7C9', brand: '盼盼' },

    { id: '221', name: '221', hex: '#FFF3EB', brand: '盼盼' },

    { id: '220', name: '220', hex: '#FFE2EA', brand: '盼盼' },

    { id: '210', name: '210', hex: '#FFC7DB', brand: '盼盼' },

    { id: '215', name: '215', hex: '#FEBAD5', brand: '盼盼' },

    { id: '241', name: '241', hex: '#D8C7D1', brand: '盼盼' },

    { id: '253', name: '253', hex: '#BD9DA1', brand: '盼盼' },

    { id: '252', name: '252', hex: '#B785A1', brand: '盼盼' },

    { id: '250', name: '250', hex: '#937A8D', brand: '盼盼' },

    { id: '282', name: '282', hex: '#E1BCE8', brand: '盼盼' },

    { id: '35', name: '35', hex: '#FD957B', brand: '盼盼' },

    { id: '31', name: '31', hex: '#FC3D46', brand: '盼盼' },

    { id: '53', name: '53', hex: '#F74941', brand: '盼盼' },

    { id: '54', name: '54', hex: '#FC283C', brand: '盼盼' },

    { id: '5', name: '5', hex: '#E7002F', brand: '盼盼' },

    { id: '16', name: '16', hex: '#943630', brand: '盼盼' },

    { id: '47', name: '47', hex: '#971937', brand: '盼盼' },

    { id: '81', name: '81', hex: '#BC0028', brand: '盼盼' },

    { id: '82', name: '82', hex: '#E2677A', brand: '盼盼' },

    { id: '116', name: '116', hex: '#8A4526', brand: '盼盼' },

    { id: '117', name: '117', hex: '#5A2121', brand: '盼盼' },

    { id: '136', name: '136', hex: '#FD4E6A', brand: '盼盼' },

    { id: '148', name: '148', hex: '#F35744', brand: '盼盼' },

    { id: '154', name: '154', hex: '#FFA9AD', brand: '盼盼' },

    { id: '204', name: '204', hex: '#D30022', brand: '盼盼' },

    { id: '211', name: '211', hex: '#FEC2A6', brand: '盼盼' },

    { id: '245', name: '245', hex: '#E69C79', brand: '盼盼' },

    { id: '246', name: '246', hex: '#D37C46', brand: '盼盼' },

    { id: '243', name: '243', hex: '#C1444A', brand: '盼盼' },

    { id: '275', name: '275', hex: '#CD9391', brand: '盼盼' },

    { id: '266', name: '266', hex: '#F7B4C6', brand: '盼盼' },

    { id: '272', name: '272', hex: '#FDC0D0', brand: '盼盼' },

    { id: '264', name: '264', hex: '#F67E66', brand: '盼盼' },

    { id: '283', name: '283', hex: '#E698AA', brand: '盼盼' },

    { id: '284', name: '284', hex: '#E54B4F', brand: '盼盼' },

    { id: '76', name: '76', hex: '#FFE2CE', brand: '盼盼' },

    { id: '49', name: '49', hex: '#FFC4AA', brand: '盼盼' },

    { id: '80', name: '80', hex: '#F4C3A5', brand: '盼盼' },

    { id: '19', name: '19', hex: '#E1B383', brand: '盼盼' },

    { id: '43', name: '43', hex: '#EDB045', brand: '盼盼' },

    { id: '50', name: '50', hex: '#E99C17', brand: '盼盼' },

    { id: '17', name: '17', hex: '#9D5B3E', brand: '盼盼' },

    { id: '12', name: '12', hex: '#753832', brand: '盼盼' },

    { id: '91', name: '91', hex: '#E6B483', brand: '盼盼' },

    { id: '87', name: '87', hex: '#D98C39', brand: '盼盼' },

    { id: '112', name: '112', hex: '#E0C593', brand: '盼盼' },

    { id: '113', name: '113', hex: '#FFC890', brand: '盼盼' },

    { id: '115', name: '115', hex: '#B7714A', brand: '盼盼' },

    { id: '114', name: '114', hex: '#8D614C', brand: '盼盼' },

    { id: '133', name: '133', hex: '#FCF9E0', brand: '盼盼' },

    { id: '134', name: '134', hex: '#F2D9BA', brand: '盼盼' },

    { id: '144', name: '144', hex: '#78524B', brand: '盼盼' },

    { id: '203', name: '203', hex: '#FFE4CC', brand: '盼盼' },

    { id: '208', name: '208', hex: '#E07935', brand: '盼盼' },

    { id: '199', name: '199', hex: '#A94023', brand: '盼盼' },

    { id: '247', name: '247', hex: '#B88558', brand: '盼盼' },

    { id: '15', name: '15', hex: '#FDFBFF', brand: '盼盼' },

    { id: '1', name: '1', hex: '#FEFFFF', brand: '盼盼' },

    { id: '13', name: '13', hex: '#B6B1BA', brand: '盼盼' },

    { id: '78', name: '78', hex: '#89858C', brand: '盼盼' },

    { id: '45', name: '45', hex: '#48464E', brand: '盼盼' },

    { id: '51', name: '51', hex: '#2F2B2F', brand: '盼盼' },

    { id: '14', name: '14', hex: '#000000', brand: '盼盼' },

    { id: '85', name: '85', hex: '#E7D6DB', brand: '盼盼' },

    { id: '95', name: '95', hex: '#EDEDED', brand: '盼盼' },

    { id: '86', name: '86', hex: '#EEE9EA', brand: '盼盼' },

    { id: '123', name: '123', hex: '#CECDD5', brand: '盼盼' },

    { id: '132', name: '132', hex: '#FFF5ED', brand: '盼盼' },

    { id: '145', name: '145', hex: '#F5ECD2', brand: '盼盼' },

    { id: '146', name: '146', hex: '#CFD7D3', brand: '盼盼' },

    { id: '201', name: '201', hex: '#98A6A8', brand: '盼盼' },

    { id: '200', name: '200', hex: '#1D1414', brand: '盼盼' },

    { id: '214', name: '214', hex: '#F1EDED', brand: '盼盼' },

    { id: '219', name: '219', hex: '#FFFDF0', brand: '盼盼' },

    { id: '209', name: '209', hex: '#F6EFE2', brand: '盼盼' },

    { id: '251', name: '251', hex: '#949FA3', brand: '盼盼' },

    { id: '291', name: '291', hex: '#FFFBE1', brand: '盼盼' },

    { id: '277', name: '277', hex: '#CACAD4', brand: '盼盼' },

    { id: '278', name: '278', hex: '#9A9D94', brand: '盼盼' },

    { id: '168', name: '168', hex: '#BCC6B8', brand: '盼盼' },

    { id: '172', name: '172', hex: '#8AA386', brand: '盼盼' },

    { id: '166', name: '166', hex: '#697D80', brand: '盼盼' },

    { id: '167', name: '167', hex: '#E3D2BC', brand: '盼盼' },

    { id: '174', name: '174', hex: '#D0CCAA', brand: '盼盼' },

    { id: '169', name: '169', hex: '#B0A782', brand: '盼盼' },

    { id: '171', name: '171', hex: '#B4A497', brand: '盼盼' },

    { id: '177', name: '177', hex: '#B38281', brand: '盼盼' },

    { id: '170', name: '170', hex: '#A58767', brand: '盼盼' },

    { id: '164', name: '164', hex: '#C5B2BC', brand: '盼盼' },

    { id: '176', name: '176', hex: '#9F7594', brand: '盼盼' },

    { id: '173', name: '173', hex: '#644749', brand: '盼盼' },

    { id: '175', name: '175', hex: '#D19066', brand: '盼盼' },

    { id: '165', name: '165', hex: '#C77362', brand: '盼盼' },

    { id: '178', name: '178', hex: '#757D78', brand: '盼盼' },

    { id: '71', name: '71', hex: '#FCF7F8', brand: '盼盼' },

    { id: '55', name: '55', hex: '#B0A9AC', brand: '盼盼' },

    { id: '73', name: '73', hex: '#AFDCAB', brand: '盼盼' },

    { id: '72', name: '72', hex: '#FEA49F', brand: '盼盼' },

    { id: '56', name: '56', hex: '#EE8C3E', brand: '盼盼' },

    { id: '157', name: '157', hex: '#5FD0A7', brand: '盼盼' },

    { id: '159', name: '159', hex: '#EB9270', brand: '盼盼' },

    { id: '158', name: '158', hex: '#F0D958', brand: '盼盼' },

    { id: '195', name: '195', hex: '#D9D9D9', brand: '盼盼' },

    { id: '187', name: '187', hex: '#D9C7EA', brand: '盼盼' },

    { id: '185', name: '185', hex: '#F3ECC9', brand: '盼盼' },

    { id: '190', name: '190', hex: '#E6EEF2', brand: '盼盼' },

    { id: '193', name: '193', hex: '#AACBEF', brand: '盼盼' },

    { id: '183', name: '183', hex: '#337680', brand: '盼盼' },

    { id: '184', name: '184', hex: '#668575', brand: '盼盼' },

    { id: '182', name: '182', hex: '#FEBF45', brand: '盼盼' },

    { id: '179', name: '179', hex: '#FEA324', brand: '盼盼' },

    { id: '194', name: '194', hex: '#FEB89F', brand: '盼盼' },

    { id: '186', name: '186', hex: '#FFFEEC', brand: '盼盼' },

    { id: '188', name: '188', hex: '#FEBECF', brand: '盼盼' },

    { id: '180', name: '180', hex: '#ECBEBF', brand: '盼盼' },

    { id: '189', name: '189', hex: '#E4A89F', brand: '盼盼' },

    { id: '181', name: '181', hex: '#A56268', brand: '盼盼' },

    { id: '109', name: '109', hex: '#F2A5E8', brand: '盼盼' },

    { id: '111', name: '111', hex: '#E9EC91', brand: '盼盼' },

    { id: '107', name: '107', hex: '#FFFF00', brand: '盼盼' },

    { id: '110', name: '110', hex: '#FFEBFA', brand: '盼盼' },

    { id: '108', name: '108', hex: '#76CEDE', brand: '盼盼' },

    { id: '67', name: '67', hex: '#D50D21', brand: '盼盼' },

    { id: '24', name: '24', hex: '#F92F83', brand: '盼盼' },

    { id: '22', name: '22', hex: '#FD8324', brand: '盼盼' },

    { id: '21', name: '21', hex: '#F8EC31', brand: '盼盼' },

    { id: '23', name: '23', hex: '#35C75B', brand: '盼盼' },

    { id: '69', name: '69', hex: '#238891', brand: '盼盼' },

    { id: '37', name: '37', hex: '#19779D', brand: '盼盼' },

    { id: '68', name: '68', hex: '#1A60C3', brand: '盼盼' },

    { id: '70', name: '70', hex: '#9A56B4', brand: '盼盼' },

    { id: '156', name: '156', hex: '#FFDB4C', brand: '盼盼' },

    { id: '151', name: '151', hex: '#FFEBFB', brand: '盼盼' },

    { id: '160', name: '160', hex: '#D8D5CE', brand: '盼盼' },

    { id: '152', name: '152', hex: '#55514C', brand: '盼盼' },

    { id: '231', name: '231', hex: '#9FE4DF', brand: '盼盼' },

    { id: '237', name: '237', hex: '#77CEE9', brand: '盼盼' },

    { id: '238', name: '238', hex: '#3ECFCA', brand: '盼盼' },

    { id: '233', name: '233', hex: '#4A867A', brand: '盼盼' },

    { id: '235', name: '235', hex: '#7FCD9D', brand: '盼盼' },

    { id: '227', name: '227', hex: '#CDE55D', brand: '盼盼' },

    { id: '230', name: '230', hex: '#E8C7B4', brand: '盼盼' },

    { id: '234', name: '234', hex: '#AD6F3C', brand: '盼盼' },

    { id: '226', name: '226', hex: '#6C372F', brand: '盼盼' },

    { id: '224', name: '224', hex: '#FEB872', brand: '盼盼' },

    { id: '228', name: '228', hex: '#F3C1C0', brand: '盼盼' },

    { id: '225', name: '225', hex: '#C9675E', brand: '盼盼' },

    { id: '229', name: '229', hex: '#D293BE', brand: '盼盼' },

    { id: '232', name: '232', hex: '#EA8CB1', brand: '盼盼' },

    { id: '236', name: '236', hex: '#9C87D6', brand: '盼盼' },

    { id: '155', name: '155', hex: '#FFFFFF', brand: '盼盼' },

    { id: '59', name: '59', hex: '#FD6FB4', brand: '盼盼' },

    { id: '60', name: '60', hex: '#FEB481', brand: '盼盼' },

    { id: '57', name: '57', hex: '#D7FAA0', brand: '盼盼' },

    { id: '58', name: '58', hex: '#8BDBFA', brand: '盼盼' },

    { id: '61', name: '61', hex: '#E987EA', brand: '盼盼' },

    { id: '254', name: '254', hex: '#DAABB3', brand: '盼盼' },

    { id: '255', name: '255', hex: '#D6AA87', brand: '盼盼' },

    { id: '256', name: '256', hex: '#C1BD8D', brand: '盼盼' },

    { id: '257', name: '257', hex: '#96869F', brand: '盼盼' },

    { id: '258', name: '258', hex: '#8490A6', brand: '盼盼' },

    { id: '259', name: '259', hex: '#94BFE2', brand: '盼盼' },

    { id: '260', name: '260', hex: '#E2A9D2', brand: '盼盼' },

    { id: '261', name: '261', hex: '#AB91C0', brand: '盼盼' },

  ],

  mixiaowo: [

    { id: '77', name: '77', hex: '#FAF4C8', brand: '咪小窝' },

    { id: '2', name: '2', hex: '#FFFFD5', brand: '咪小窝' },

    { id: '28', name: '28', hex: '#FEFF8B', brand: '咪小窝' },

    { id: '3', name: '3', hex: '#FBED56', brand: '咪小窝' },

    { id: '79', name: '79', hex: '#F4D738', brand: '咪小窝' },

    { id: '29', name: '29', hex: '#FEAC4C', brand: '咪小窝' },

    { id: '4', name: '4', hex: '#FE8B4C', brand: '咪小窝' },

    { id: '98', name: '98', hex: '#FFDA45', brand: '咪小窝' },

    { id: '97', name: '97', hex: '#FF995B', brand: '咪小窝' },

    { id: '96', name: '96', hex: '#F77C31', brand: '咪小窝' },

    { id: '109', name: '109', hex: '#FFDD99', brand: '咪小窝' },

    { id: '110', name: '110', hex: '#FE9F72', brand: '咪小窝' },

    { id: '116', name: '116', hex: '#FFC365', brand: '咪小窝' },

    { id: '135', name: '135', hex: '#FD543D', brand: '咪小窝' },

    { id: '150', name: '150', hex: '#FFF365', brand: '咪小窝' },

    { id: '216', name: '216', hex: '#FFFF9F', brand: '咪小窝' },

    { id: '213', name: '213', hex: '#FFE36E', brand: '咪小窝' },

    { id: '208', name: '208', hex: '#FEBE7D', brand: '咪小窝' },

    { id: '218', name: '218', hex: '#FD7C72', brand: '咪小窝' },

    { id: '242', name: '242', hex: '#FFD568', brand: '咪小窝' },

    { id: '261', name: '261', hex: '#FFE395', brand: '咪小窝' },

    { id: '255', name: '255', hex: '#F4F57D', brand: '咪小窝' },

    { id: '259', name: '259', hex: '#E6C9B7', brand: '咪小窝' },

    { id: '273', name: '273', hex: '#F7F8A2', brand: '咪小窝' },

    { id: '274', name: '274', hex: '#FFD67D', brand: '咪小窝' },

    { id: '275', name: '275', hex: '#FFC830', brand: '咪小窝' },

    { id: '48', name: '48', hex: '#E6EE31', brand: '咪小窝' },

    { id: '33', name: '33', hex: '#63F347', brand: '咪小窝' },

    { id: '26', name: '26', hex: '#9EF780', brand: '咪小窝' },

    { id: '78', name: '78', hex: '#5DE035', brand: '咪小窝' },

    { id: '39', name: '39', hex: '#35E352', brand: '咪小窝' },

    { id: '11', name: '11', hex: '#65E2A6', brand: '咪小窝' },

    { id: '44', name: '44', hex: '#3DAF80', brand: '咪小窝' },

    { id: '10', name: '10', hex: '#1C9C4F', brand: '咪小窝' },

    { id: '84', name: '84', hex: '#27523A', brand: '咪小窝' },

    { id: '100', name: '100', hex: '#95D3C2', brand: '咪小窝' },

    { id: '99', name: '99', hex: '#5D722A', brand: '咪小窝' },

    { id: '111', name: '111', hex: '#166F41', brand: '咪小窝' },

    { id: '119', name: '119', hex: '#CAEB7B', brand: '咪小窝' },

    { id: '117', name: '117', hex: '#ADE946', brand: '咪小窝' },

    { id: '122', name: '122', hex: '#2E5132', brand: '咪小窝' },

    { id: '133', name: '133', hex: '#C5ED9C', brand: '咪小窝' },

    { id: '141', name: '141', hex: '#9BB13A', brand: '咪小窝' },

    { id: '147', name: '147', hex: '#E6EE49', brand: '咪小窝' },

    { id: '174', name: '174', hex: '#24B88C', brand: '咪小窝' },

    { id: '175', name: '175', hex: '#C2F0CC', brand: '咪小窝' },

    { id: '194', name: '194', hex: '#156A6B', brand: '咪小窝' },

    { id: '193', name: '193', hex: '#0B3C43', brand: '咪小窝' },

    { id: '192', name: '192', hex: '#303A21', brand: '咪小窝' },

    { id: '207', name: '207', hex: '#EEFCA5', brand: '咪小窝' },

    { id: '240', name: '240', hex: '#4E846D', brand: '咪小窝' },

    { id: '248', name: '248', hex: '#8D7A35', brand: '咪小窝' },

    { id: '262', name: '262', hex: '#CCE1AF', brand: '咪小窝' },

    { id: '254', name: '254', hex: '#9EE5B9', brand: '咪小窝' },

    { id: '253', name: '253', hex: '#C5E254', brand: '咪小窝' },

    { id: '270', name: '270', hex: '#E2FCB1', brand: '咪小窝' },

    { id: '271', name: '271', hex: '#B0E792', brand: '咪小窝' },

    { id: '272', name: '272', hex: '#9CAB5A', brand: '咪小窝' },

    { id: '76', name: '76', hex: '#E8FFE7', brand: '咪小窝' },

    { id: '30', name: '30', hex: '#A9F9FC', brand: '咪小窝' },

    { id: '75', name: '75', hex: '#A0E2FB', brand: '咪小窝' },

    { id: '82', name: '82', hex: '#41CCFF', brand: '咪小窝' },

    { id: '34', name: '34', hex: '#01ACEB', brand: '咪小窝' },

    { id: '25', name: '25', hex: '#50AAF0', brand: '咪小窝' },

    { id: '9', name: '9', hex: '#3677D2', brand: '咪小窝' },

    { id: '71', name: '71', hex: '#0F54C0', brand: '咪小窝' },

    { id: '42', name: '42', hex: '#324BCA', brand: '咪小窝' },

    { id: '130', name: '130', hex: '#3EBCE2', brand: '咪小窝' },

    { id: '113', name: '113', hex: '#28DDDE', brand: '咪小窝' },

    { id: '120', name: '120', hex: '#1C334D', brand: '咪小窝' },

    { id: '142', name: '142', hex: '#CDE8FF', brand: '咪小窝' },

    { id: '136', name: '136', hex: '#D5FDFF', brand: '咪小窝' },

    { id: '132', name: '132', hex: '#22C4C6', brand: '咪小窝' },

    { id: '149', name: '149', hex: '#1557A8', brand: '咪小窝' },

    { id: '156', name: '156', hex: '#04D1F6', brand: '咪小窝' },

    { id: '196', name: '196', hex: '#1D3344', brand: '咪小窝' },

    { id: '202', name: '202', hex: '#1887A2', brand: '咪小窝' },

    { id: '197', name: '197', hex: '#176DAF', brand: '咪小窝' },

    { id: '212', name: '212', hex: '#BEDDFF', brand: '咪小窝' },

    { id: '239', name: '239', hex: '#67B4BE', brand: '咪小窝' },

    { id: '263', name: '263', hex: '#C8E2FF', brand: '咪小窝' },

    { id: '252', name: '252', hex: '#7CC4FF', brand: '咪小窝' },

    { id: '256', name: '256', hex: '#A9E5E5', brand: '咪小窝' },

    { id: '250', name: '250', hex: '#3CAED8', brand: '咪小窝' },

    { id: '264', name: '264', hex: '#D3DFFA', brand: '咪小窝' },

    { id: '265', name: '265', hex: '#BBCFED', brand: '咪小窝' },

    { id: '266', name: '266', hex: '#34488E', brand: '咪小窝' },

    { id: '46', name: '46', hex: '#AEB4F2', brand: '咪小窝' },

    { id: '36', name: '36', hex: '#858EDD', brand: '咪小窝' },

    { id: '8', name: '8', hex: '#2F54AF', brand: '咪小窝' },

    { id: '80', name: '80', hex: '#182A84', brand: '咪小窝' },

    { id: '32', name: '32', hex: '#B843C5', brand: '咪小窝' },

    { id: '27', name: '27', hex: '#AC7BDE', brand: '咪小窝' },

    { id: '7', name: '7', hex: '#8854B3', brand: '咪小窝' },

    { id: '89', name: '89', hex: '#E2D3FF', brand: '咪小窝' },

    { id: '90', name: '90', hex: '#D5B9F8', brand: '咪小窝' },

    { id: '91', name: '91', hex: '#361851', brand: '咪小窝' },

    { id: '104', name: '104', hex: '#B9BAE1', brand: '咪小窝' },

    { id: '105', name: '105', hex: '#DE9AD4', brand: '咪小窝' },

    { id: '106', name: '106', hex: '#B90095', brand: '咪小窝' },

    { id: '107', name: '107', hex: '#8B279B', brand: '咪小窝' },

    { id: '108', name: '108', hex: '#2F1F90', brand: '咪小窝' },

    { id: '126', name: '126', hex: '#E3E1EE', brand: '咪小窝' },

    { id: '128', name: '128', hex: '#C4D4F6', brand: '咪小窝' },

    { id: '125', name: '125', hex: '#A45EC7', brand: '咪小窝' },

    { id: '153', name: '153', hex: '#D8C3D7', brand: '咪小窝' },

    { id: '155', name: '155', hex: '#9C32B2', brand: '咪小窝' },

    { id: '158', name: '158', hex: '#9A009B', brand: '咪小窝' },

    { id: '198', name: '198', hex: '#333A95', brand: '咪小窝' },

    { id: '217', name: '217', hex: '#EBDAFC', brand: '咪小窝' },

    { id: '244', name: '244', hex: '#7786E5', brand: '咪小窝' },

    { id: '234', name: '234', hex: '#494FC7', brand: '咪小窝' },

    { id: '258', name: '258', hex: '#DFC2F8', brand: '咪小窝' },

    { id: '18', name: '18', hex: '#FDD3CC', brand: '咪小窝' },

    { id: '38', name: '38', hex: '#FEC0DF', brand: '咪小窝' },

    { id: '74', name: '74', hex: '#FFB7E7', brand: '咪小窝' },

    { id: '6', name: '6', hex: '#E8649E', brand: '咪小窝' },

    { id: '40', name: '40', hex: '#F551A2', brand: '咪小窝' },

    { id: '20', name: '20', hex: '#F13D74', brand: '咪小窝' },

    { id: '41', name: '41', hex: '#C63478', brand: '咪小窝' },

    { id: '103', name: '103', hex: '#FFDBE9', brand: '咪小窝' },

    { id: '95', name: '95', hex: '#E970CC', brand: '咪小窝' },

    { id: '94', name: '94', hex: '#D33793', brand: '咪小窝' },

    { id: '131', name: '131', hex: '#FCDDD2', brand: '咪小窝' },

    { id: '112', name: '112', hex: '#F78FC3', brand: '咪小窝' },

    { id: '124', name: '124', hex: '#B5006D', brand: '咪小窝' },

    { id: '140', name: '140', hex: '#FFD1BA', brand: '咪小窝' },

    { id: '139', name: '139', hex: '#F8C7C9', brand: '咪小窝' },

    { id: '206', name: '206', hex: '#FFF3EB', brand: '咪小窝' },

    { id: '205', name: '205', hex: '#FFE2EA', brand: '咪小窝' },

    { id: '210', name: '210', hex: '#FFC7DB', brand: '咪小窝' },

    { id: '215', name: '215', hex: '#FEBAD5', brand: '咪小窝' },

    { id: '241', name: '241', hex: '#D8C7D1', brand: '咪小窝' },

    { id: '238', name: '238', hex: '#BD9DA1', brand: '咪小窝' },

    { id: '237', name: '237', hex: '#B785A1', brand: '咪小窝' },

    { id: '235', name: '235', hex: '#937A8D', brand: '咪小窝' },

    { id: '267', name: '267', hex: '#E1BCE8', brand: '咪小窝' },

    { id: '35', name: '35', hex: '#FD957B', brand: '咪小窝' },

    { id: '31', name: '31', hex: '#FC3D46', brand: '咪小窝' },

    { id: '72', name: '72', hex: '#F74941', brand: '咪小窝' },

    { id: '73', name: '73', hex: '#FC283C', brand: '咪小窝' },

    { id: '5', name: '5', hex: '#E7002F', brand: '咪小窝' },

    { id: '16', name: '16', hex: '#943630', brand: '咪小窝' },

    { id: '47', name: '47', hex: '#971937', brand: '咪小窝' },

    { id: '92', name: '92', hex: '#BC0028', brand: '咪小窝' },

    { id: '93', name: '93', hex: '#E2677A', brand: '咪小窝' },

    { id: '115', name: '115', hex: '#8A4526', brand: '咪小窝' },

    { id: '129', name: '129', hex: '#5A2121', brand: '咪小窝' },

    { id: '134', name: '134', hex: '#FD4E6A', brand: '咪小窝' },

    { id: '148', name: '148', hex: '#F35744', brand: '咪小窝' },

    { id: '154', name: '154', hex: '#FFA9AD', brand: '咪小窝' },

    { id: '191', name: '191', hex: '#D30022', brand: '咪小窝' },

    { id: '211', name: '211', hex: '#FEC2A6', brand: '咪小窝' },

    { id: '245', name: '245', hex: '#E69C79', brand: '咪小窝' },

    { id: '246', name: '246', hex: '#D37C46', brand: '咪小窝' },

    { id: '243', name: '243', hex: '#C1444A', brand: '咪小窝' },

    { id: '260', name: '260', hex: '#CD9391', brand: '咪小窝' },

    { id: '251', name: '251', hex: '#F7B4C6', brand: '咪小窝' },

    { id: '257', name: '257', hex: '#FDC0D0', brand: '咪小窝' },

    { id: '249', name: '249', hex: '#F67E66', brand: '咪小窝' },

    { id: '268', name: '268', hex: '#E698AA', brand: '咪小窝' },

    { id: '269', name: '269', hex: '#E54B4F', brand: '咪小窝' },

    { id: '81', name: '81', hex: '#FFE2CE', brand: '咪小窝' },

    { id: '49', name: '49', hex: '#FFC4AA', brand: '咪小窝' },

    { id: '85', name: '85', hex: '#F4C3A5', brand: '咪小窝' },

    { id: '19', name: '19', hex: '#E1B383', brand: '咪小窝' },

    { id: '43', name: '43', hex: '#EDB045', brand: '咪小窝' },

    { id: '50', name: '50', hex: '#E99C17', brand: '咪小窝' },

    { id: '17', name: '17', hex: '#9D5B3E', brand: '咪小窝' },

    { id: '12', name: '12', hex: '#753832', brand: '咪小窝' },

    { id: '102', name: '102', hex: '#E6B483', brand: '咪小窝' },

    { id: '101', name: '101', hex: '#D98C39', brand: '咪小窝' },

    { id: '118', name: '118', hex: '#E0C593', brand: '咪小窝' },

    { id: '127', name: '127', hex: '#FFC890', brand: '咪小窝' },

    { id: '114', name: '114', hex: '#B7714A', brand: '咪小窝' },

    { id: '123', name: '123', hex: '#8D614C', brand: '咪小窝' },

    { id: '143', name: '143', hex: '#FCF9E0', brand: '咪小窝' },

    { id: '138', name: '138', hex: '#F2D9BA', brand: '咪小窝' },

    { id: '137', name: '137', hex: '#78524B', brand: '咪小窝' },

    { id: '203', name: '203', hex: '#FFE4CC', brand: '咪小窝' },

    { id: '195', name: '195', hex: '#E07935', brand: '咪小窝' },

    { id: '199', name: '199', hex: '#A94023', brand: '咪小窝' },

    { id: '247', name: '247', hex: '#B88558', brand: '咪小窝' },

    { id: '15', name: '15', hex: '#FDFBFF', brand: '咪小窝' },

    { id: '1', name: '1', hex: '#FEFFFF', brand: '咪小窝' },

    { id: '13', name: '13', hex: '#B6B1BA', brand: '咪小窝' },

    { id: '83', name: '83', hex: '#89858C', brand: '咪小窝' },

    { id: '45', name: '45', hex: '#48464E', brand: '咪小窝' },

    { id: '70', name: '70', hex: '#2F2B2F', brand: '咪小窝' },

    { id: '14', name: '14', hex: '#000000', brand: '咪小窝' },

    { id: '86', name: '86', hex: '#E7D6DB', brand: '咪小窝' },

    { id: '87', name: '87', hex: '#EDEDED', brand: '咪小窝' },

    { id: '88', name: '88', hex: '#EEE9EA', brand: '咪小窝' },

    { id: '121', name: '121', hex: '#CECDD5', brand: '咪小窝' },

    { id: '144', name: '144', hex: '#FFF5ED', brand: '咪小窝' },

    { id: '146', name: '146', hex: '#F5ECD2', brand: '咪小窝' },

    { id: '145', name: '145', hex: '#CFD7D3', brand: '咪小窝' },

    { id: '201', name: '201', hex: '#98A6A8', brand: '咪小窝' },

    { id: '200', name: '200', hex: '#1D1414', brand: '咪小窝' },

    { id: '214', name: '214', hex: '#F1EDED', brand: '咪小窝' },

    { id: '204', name: '204', hex: '#FFFDF0', brand: '咪小窝' },

    { id: '209', name: '209', hex: '#F6EFE2', brand: '咪小窝' },

    { id: '236', name: '236', hex: '#949FA3', brand: '咪小窝' },

    { id: '276', name: '276', hex: '#FFFBE1', brand: '咪小窝' },

    { id: '277', name: '277', hex: '#CACAD4', brand: '咪小窝' },

    { id: '278', name: '278', hex: '#9A9D94', brand: '咪小窝' },

    { id: '168', name: '168', hex: '#BCC6B8', brand: '咪小窝' },

    { id: '172', name: '172', hex: '#8AA386', brand: '咪小窝' },

    { id: '166', name: '166', hex: '#697D80', brand: '咪小窝' },

    { id: '167', name: '167', hex: '#E3D2BC', brand: '咪小窝' },

    { id: '159', name: '159', hex: '#D0CCAA', brand: '咪小窝' },

    { id: '169', name: '169', hex: '#B0A782', brand: '咪小窝' },

    { id: '171', name: '171', hex: '#B4A497', brand: '咪小窝' },

    { id: '162', name: '162', hex: '#B38281', brand: '咪小窝' },

    { id: '170', name: '170', hex: '#A58767', brand: '咪小窝' },

    { id: '164', name: '164', hex: '#C5B2BC', brand: '咪小窝' },

    { id: '161', name: '161', hex: '#9F7594', brand: '咪小窝' },

    { id: '173', name: '173', hex: '#644749', brand: '咪小窝' },

    { id: '160', name: '160', hex: '#D19066', brand: '咪小窝' },

    { id: '165', name: '165', hex: '#C77362', brand: '咪小窝' },

    { id: '163', name: '163', hex: '#757D78', brand: '咪小窝' },

    { id: '62', name: '62', hex: '#FCF7F8', brand: '咪小窝' },

    { id: '69', name: '69', hex: '#B0A9AC', brand: '咪小窝' },

    { id: '66', name: '66', hex: '#AFDCAB', brand: '咪小窝' },

    { id: '64', name: '64', hex: '#FEA49F', brand: '咪小窝' },

    { id: '63', name: '63', hex: '#EE8C3E', brand: '咪小窝' },

    { id: '65', name: '65', hex: '#5FD0A7', brand: '咪小窝' },

    { id: '68', name: '68', hex: '#EB9270', brand: '咪小窝' },

    { id: '67', name: '67', hex: '#F0D958', brand: '咪小窝' },

    { id: '178', name: '178', hex: '#D9D9D9', brand: '咪小窝' },

    { id: '187', name: '187', hex: '#D9C7EA', brand: '咪小窝' },

    { id: '185', name: '185', hex: '#F3ECC9', brand: '咪小窝' },

    { id: '190', name: '190', hex: '#E6EEF2', brand: '咪小窝' },

    { id: '176', name: '176', hex: '#AACBEF', brand: '咪小窝' },

    { id: '183', name: '183', hex: '#337680', brand: '咪小窝' },

    { id: '184', name: '184', hex: '#668575', brand: '咪小窝' },

    { id: '182', name: '182', hex: '#FEBF45', brand: '咪小窝' },

    { id: '179', name: '179', hex: '#FEA324', brand: '咪小窝' },

    { id: '177', name: '177', hex: '#FEB89F', brand: '咪小窝' },

    { id: '186', name: '186', hex: '#FFFEEC', brand: '咪小窝' },

    { id: '180', name: '180', hex: '#FEBECF', brand: '咪小窝' },

    { id: '188', name: '188', hex: '#ECBEBF', brand: '咪小窝' },

    { id: '189', name: '189', hex: '#E4A89F', brand: '咪小窝' },

    { id: '181', name: '181', hex: '#A56268', brand: '咪小窝' },

    { id: 'W3', name: 'W3', hex: '#F2A5E8', brand: '咪小窝' },

    { id: 'W4', name: 'W4', hex: '#E9EC91', brand: '咪小窝' },

    { id: 'W1', name: 'W1', hex: '#FFFF00', brand: '咪小窝' },

    { id: 'W2', name: 'W2', hex: '#FFEBFA', brand: '咪小窝' },

    { id: 'W5', name: 'W5', hex: '#76CEDE', brand: '咪小窝' },

    { id: '52', name: '52', hex: '#D50D21', brand: '咪小窝' },

    { id: '24', name: '24', hex: '#F92F83', brand: '咪小窝' },

    { id: '22', name: '22', hex: '#FD8324', brand: '咪小窝' },

    { id: '21', name: '21', hex: '#F8EC31', brand: '咪小窝' },

    { id: '23', name: '23', hex: '#35C75B', brand: '咪小窝' },

    { id: '55', name: '55', hex: '#238891', brand: '咪小窝' },

    { id: '37', name: '37', hex: '#19779D', brand: '咪小窝' },

    { id: '54', name: '54', hex: '#1A60C3', brand: '咪小窝' },

    { id: '56', name: '56', hex: '#9A56B4', brand: '咪小窝' },

    { id: '53', name: '53', hex: '#FFDB4C', brand: '咪小窝' },

    { id: '151', name: '151', hex: '#FFEBFB', brand: '咪小窝' },

    { id: '157', name: '157', hex: '#D8D5CE', brand: '咪小窝' },

    { id: '152', name: '152', hex: '#55514C', brand: '咪小窝' },

    { id: '231', name: '231', hex: '#9FE4DF', brand: '咪小窝' },

    { id: '224', name: '224', hex: '#77CEE9', brand: '咪小窝' },

    { id: '225', name: '225', hex: '#3ECFCA', brand: '咪小窝' },

    { id: '233', name: '233', hex: '#4A867A', brand: '咪小窝' },

    { id: '222', name: '222', hex: '#7FCD9D', brand: '咪小窝' },

    { id: '227', name: '227', hex: '#CDE55D', brand: '咪小窝' },

    { id: '230', name: '230', hex: '#E8C7B4', brand: '咪小窝' },

    { id: '221', name: '221', hex: '#AD6F3C', brand: '咪小窝' },

    { id: '226', name: '226', hex: '#6C372F', brand: '咪小窝' },

    { id: '219', name: '219', hex: '#FEB872', brand: '咪小窝' },

    { id: '228', name: '228', hex: '#F3C1C0', brand: '咪小窝' },

    { id: '220', name: '220', hex: '#C9675E', brand: '咪小窝' },

    { id: '229', name: '229', hex: '#D293BE', brand: '咪小窝' },

    { id: '232', name: '232', hex: '#EA8CB1', brand: '咪小窝' },

    { id: '223', name: '223', hex: '#9C87D6', brand: '咪小窝' },

    { id: '51', name: '51', hex: '#FFFFFF', brand: '咪小窝' },

    { id: '59', name: '59', hex: '#FD6FB4', brand: '咪小窝' },

    { id: '60', name: '60', hex: '#FEB481', brand: '咪小窝' },

    { id: '57', name: '57', hex: '#D7FAA0', brand: '咪小窝' },

    { id: '58', name: '58', hex: '#8BDBFA', brand: '咪小窝' },

    { id: '61', name: '61', hex: '#E987EA', brand: '咪小窝' },

    { id: 'ZG1', name: 'ZG1', hex: '#DAABB3', brand: '咪小窝' },

    { id: 'ZG2', name: 'ZG2', hex: '#D6AA87', brand: '咪小窝' },

    { id: 'ZG3', name: 'ZG3', hex: '#C1BD8D', brand: '咪小窝' },

    { id: 'ZG4', name: 'ZG4', hex: '#96869F', brand: '咪小窝' },

    { id: 'ZG5', name: 'ZG5', hex: '#8490A6', brand: '咪小窝' },

    { id: 'ZG6', name: 'ZG6', hex: '#94BFE2', brand: '咪小窝' },

    { id: 'ZG7', name: 'ZG7', hex: '#E2A9D2', brand: '咪小窝' },

    { id: 'ZG8', name: 'ZG8', hex: '#AB91C0', brand: '咪小窝' },

  ],

};



export const PALETTE_NAMES: Record<string, { zh: string; en: string; ja: string; ko: string }> = {

  mard221:  { zh: 'MARD 221',   en: 'MARD 221',   ja: 'MARD 221',   ko: 'MARD 221' },

  mard264:  { zh: 'MARD 264',   en: 'MARD 264',   ja: 'MARD 264',   ko: 'MARD 264' },

  mard291:  { zh: 'MARD 291',   en: 'MARD 291',   ja: 'MARD 291',   ko: 'MARD 291' },

  coco:     { zh: 'COCO',       en: 'COCO',       ja: 'COCO',       ko: 'COCO' },

  manman:   { zh: '漫漫拼豆',   en: 'Manman',     ja: 'マンマン',   ko: '??' },

  panpan:   { zh: '盼盼拼豆',   en: 'Panpan',     ja: 'パンパン',   ko: '??' },

  mixiaowo: { zh: '咪小窝',     en: 'Mixiaowo',   ja: 'ミーシャオォ', ko: '????' },

};

// ==================== 颜色工具函数 ====================



// hex ?RGB

export function hexToRgb(hex: string): [number, number, number] {

  const r = parseInt(hex.slice(1, 3), 16);

  const g = parseInt(hex.slice(3, 5), 16);

  const b = parseInt(hex.slice(5, 7), 16);

  return [r, g, b];

}



// ==================== Oklab 色彩空间 ====================

// 参? https://bottosson.github.io/posts/oklab/

// 参? Zippland/perler-beads (Oklab 距离)

// Oklab 是感知均匀的色彩空间，人眼看着像的颜色距离?

interface OklabColor {

  L: number;

  a: number;

  b: number;

}



// sRGB ?线?RGB

function srgbToLinear(channel: number): number {

  const c = channel / 255;

  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

}



// RGB ?Oklab

function rgbToOklab(r: number, g: number, b: number): OklabColor {

  const lr = srgbToLinear(r);

  const lg = srgbToLinear(g);

  const lb = srgbToLinear(b);



  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;

  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;

  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;



  const lRoot = Math.cbrt(l_);

  const mRoot = Math.cbrt(m_);

  const sRoot = Math.cbrt(s_);



  return {

    L: 0.2104542553 * lRoot + 0.7936177850 * mRoot - 0.0040720468 * sRoot,

    a: 1.9779984951 * lRoot - 2.4285922050 * mRoot + 0.4505937099 * sRoot,

    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.8086757660 * sRoot,

  };

}



// Oklab 缓存

const oklabCache = new Map<string, OklabColor>();



function getOklab(r: number, g: number, b: number): OklabColor {

  const key = `${r},${g},${b}`;

  let cached = oklabCache.get(key);

  if (!cached) {

    cached = rgbToOklab(r, g, b);

    oklabCache.set(key, cached);

  }

  return cached;

}



// Oklab 色彩距离（感知均匀，比 RGB 欧氏距离更符合人眼）

function colorDistanceOklab(

  r1: number, g1: number, b1: number,

  r2: number, g2: number, b2: number

): number {

  const lab1 = getOklab(r1, g1, b1);

  const lab2 = getOklab(r2, g2, b2);

  const dL = lab1.L - lab2.L;

  const da = lab1.a - lab2.a;

  const db = lab1.b - lab2.b;

  return Math.sqrt(dL * dL + da * da + db * db) * 100;

}



// RGB 欧氏距离（简单快速）

function colorDistanceRgb(

  r1: number, g1: number, b1: number,

  r2: number, g2: number, b2: number

): number {

  const dr = r1 - r2;

  const dg = g1 - g2;

  const db = b1 - b2;

  return Math.sqrt(dr * dr + dg * dg + db * db);

}



// 颜色距离（根据算法选择）

function colorDistanceWeighted(

  r1: number, g1: number, b1: number,

  r2: number, g2: number, b2: number,

  algorithm: 'oklab' | 'rgb' | 'ciede2000' = 'oklab'

): number {

  if (algorithm === 'rgb') return colorDistanceRgb(r1, g1, b1, r2, g2, b2);

  return colorDistanceOklab(r1, g1, b1, r2, g2, b2);

}



// 预计算色板的 RGB 值（缓存优化）

const paletteRgbCache = new Map<string, [number, number, number][]>();



function getPaletteRgb(palette: PerlerColor[]): [number, number, number][] {

  const cacheKey = palette.map(c => c.hex).join(',');

  if (!paletteRgbCache.has(cacheKey)) {

    paletteRgbCache.set(cacheKey, palette.map(c => hexToRgb(c.hex)));

  }

  return paletteRgbCache.get(cacheKey)!;

}



// 找到最接近的颜色（返回 [color, index]）

function findClosestColorEntry(r: number, g: number, b: number, palette: PerlerColor[], algorithm: 'oklab' | 'rgb' | 'ciede2000' = 'oklab'): [PerlerColor, number] {

  const rgbList = getPaletteRgb(palette);

  let minDist = Infinity;

  let closestIdx = 0;

  for (let i = 0; i < palette.length; i++) {

    const [cr, cg, cb] = rgbList[i];

    const dist = colorDistanceWeighted(r, g, b, cr, cg, cb, algorithm);

    if (dist < minDist) {

      minDist = dist;

      closestIdx = i;

    }

  }

  return [palette[closestIdx], closestIdx];

}



function findClosestColor(r: number, g: number, b: number, palette: PerlerColor[], algorithm: 'oklab' | 'rgb' | 'ciede2000' = 'oklab'): PerlerColor {

  return findClosestColorEntry(r, g, b, palette, algorithm)[0];

}



// ==================== Floyd-Steinberg 抖动算法 ====================

// 误差扩散矩阵:

//         X    7/16

//  3/16  5/16  1/16



function applyDithering(

  pixels: Float64Array,

  width: number,

  height: number,

  palette: PerlerColor[],

  algorithm: 'oklab' | 'rgb' | 'ciede2000' = 'oklab'

): string[][] {

  const grid: string[][] = [];

  const paletteRgb = getPaletteRgb(palette);

  // 错误扩散矩阵

  const errR = new Float64Array(width * height);

  const errG = new Float64Array(width * height);

  const errB = new Float64Array(width * height);



  for (let y = 0; y < height; y++) {

    const row: string[] = [];

    for (let x = 0; x < width; x++) {

      const idx = y * width + x;

      const baseIdx = idx * 3;

      // 加上累积的误差

      const r = Math.max(0, Math.min(255, pixels[baseIdx] + errR[idx]));

      const g = Math.max(0, Math.min(255, pixels[baseIdx + 1] + errG[idx]));

      const b = Math.max(0, Math.min(255, pixels[baseIdx + 2] + errB[idx]));



      // 找到最接近的色板颜色

      let minDist = Infinity;

      let bestIdx = 0;

      for (let i = 0; i < paletteRgb.length; i++) {

        const [cr, cg, cb] = paletteRgb[i];

        const dist = colorDistanceWeighted(r, g, b, cr, cg, cb, algorithm);

        if (dist < minDist) {

          minDist = dist;

          bestIdx = i;

        }

      }



      const [cr, cg, cb] = paletteRgb[bestIdx];



      // 计算量化误差

      const quantErrR = r - cr;

      const quantErrG = g - cg;

      const quantErrB = b - cb;



      // Floyd-Steinberg 误差扩散

      const spread = (dx: number, dy: number, weight: number) => {

        const nx = x + dx;

        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {

          const nIdx = ny * width + nx;

          errR[nIdx] += quantErrR * weight;

          errG[nIdx] += quantErrG * weight;

          errB[nIdx] += quantErrB * weight;

        }

      };

      spread(1, 0, 7 / 16);   // ?      spread(-1, 1, 3 / 16);  // 左下

      spread(0, 1, 5 / 16);   // ?      spread(1, 1, 1 / 16);   // 右下



      row.push(palette[bestIdx].id);

    }

    grid.push(row);

  }

  return grid;

}



// ==================== 简单像素化（无抖动?====================



function applySimpleMapping(

  pixels: Uint8ClampedArray,

  width: number,

  height: number,

  palette: PerlerColor[],

  mode: 'dominant' | 'average' = 'dominant'

): string[][] {

  const grid: string[][] = [];

  for (let y = 0; y < height; y++) {

    const row: string[] = [];

    for (let x = 0; x < width; x++) {

      const offset = (y * width + x) * 4;

      // 跳过透明像素

      if (pixels[offset + 3] < 128) {

        row.push('BG');

        continue;

      }

      const r = pixels[offset];

      const g = pixels[offset + 1];

      const b = pixels[offset + 2];

      const color = findClosestColor(r, g, b, palette);

      row.push(color.id);

    }

    grid.push(row);

  }

  return grid;

}



// ==================== BFS 连通区域合?====================



function mergeRegions(grid: string[][], threshold: number): string[][] {

  const height = grid.length;

  const width = grid[0].length;

  const visited = Array.from({ length: height }, () => Array(width).fill(false));

  const result = grid.map(row => [...row]);



  for (let y = 0; y < height; y++) {

    for (let x = 0; x < width; x++) {

      if (visited[y][x]) continue;

      const region: [number, number][] = [];

      const queue: [number, number][] = [[x, y]];

      visited[y][x] = true;

      const targetColor = grid[y][x];



      while (queue.length > 0) {

        const [cx, cy] = queue.shift()!;

        region.push([cx, cy]);

        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {

          const nx = cx + dx;

          const ny = cy + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {

            if (grid[ny][nx] === targetColor) {

              visited[ny][nx] = true;

              queue.push([nx, ny]);

            }

          }

        }

      }



      if (region.length < threshold) {

        for (const [rx, ry] of region) {

          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {

            const nx = rx + dx;

            const ny = ry + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {

              if (grid[ny][nx] !== targetColor) {

                result[ry][rx] = grid[ny][nx];

                break;

              }

            }

          }

        }

      }

    }

  }

  return result;

}



// ==================== 背景移除 ====================



function removeBackground(grid: string[][], bgColor: string): boolean[][] {

  const height = grid.length;

  const width = grid[0].length;

  const isBackground = Array.from({ length: height }, () => Array(width).fill(false));

  const visited = Array.from({ length: height }, () => Array(width).fill(false));



  const queue: [number, number][] = [];

  for (let x = 0; x < width; x++) {

    if (grid[0][x] === bgColor) { queue.push([x, 0]); visited[0][x] = true; }

    if (grid[height - 1][x] === bgColor) { queue.push([x, height - 1]); visited[height - 1][x] = true; }

  }

  for (let y = 0; y < height; y++) {

    if (grid[y][0] === bgColor && !visited[y][0]) { queue.push([0, y]); visited[y][0] = true; }

    if (grid[y][width - 1] === bgColor && !visited[y][width - 1]) { queue.push([width - 1, y]); visited[y][width - 1] = true; }

  }



  while (queue.length > 0) {

    const [x, y] = queue.shift()!;

    isBackground[y][x] = true;

    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {

      const nx = x + dx;

      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx] && grid[ny][nx] === bgColor) {

        visited[ny][nx] = true;

        queue.push([nx, ny]);

      }

    }

  }

  return isBackground;

}



// ==================== 图像预处?====================



export interface PreprocessOptions {

  brightness: number;     // 亮度调整 -100~+100，0=不变

  contrast: number;       // 对比度调整 -100~+100，0=不变

  saturation: number;     // 饱和度调整 -100~+100，0=不变

  colorTemperature: number; // 色温 -100(冷)~+100(暖)，0=不变

  sharpen: boolean;       // 锐化（增强轮廓）

  denoise: boolean;       // 降噪（平滑渐变）

  removeBackground: boolean; // 移除背景

}



// 亮度调整（-100..+100，0=不变）

function adjustBrightness(r: number, g: number, b: number, amount: number): [number, number, number] {

  // amount: -100 to 100, 0 = no change

  const factor = amount / 100; // -1 to 1

  return [

    Math.max(0, Math.min(255, Math.round(r + r * factor))),

    Math.max(0, Math.min(255, Math.round(g + g * factor))),

    Math.max(0, Math.min(255, Math.round(b + b * factor))),

  ];

}



// 对比度调整（-100..+100，0=不变）

function adjustContrast(r: number, g: number, b: number, amount: number): [number, number, number] {

  // amount: -100 to 100, 0 = no change

  const factor = (259 * (amount + 255)) / (255 * (259 - amount));

  return [

    Math.max(0, Math.min(255, Math.round(factor * (r - 128) + 128))),

    Math.max(0, Math.min(255, Math.round(factor * (g - 128) + 128))),

    Math.max(0, Math.min(255, Math.round(factor * (b - 128) + 128))),

  ];

}



// 饱和度调整（-100..+100，0=不变）

function adjustSaturation(r: number, g: number, b: number, amount: number): [number, number, number] {

  // amount: -100 to 100, 0 = no change

  const gray = 0.299 * r + 0.587 * g + 0.114 * b;

  const f = (amount + 100) / 100; // 0 at -100, 1 at 0, 2 at +100

  return [

    Math.max(0, Math.min(255, Math.round(gray + f * (r - gray)))),

    Math.max(0, Math.min(255, Math.round(gray + f * (g - gray)))),

    Math.max(0, Math.min(255, Math.round(gray + f * (b - gray)))),

  ];

}



// 色温调整（-100(冷/蓝)~+100(暖/橙)，0=不变）

function adjustColorTemperature(r: number, g: number, b: number, amount: number): [number, number, number] {

  const factor = amount / 100; // -1 to 1

  if (factor > 0) {

    // 暖色：增加红/绿，减少蓝

    return [

      Math.min(255, Math.round(r + factor * 30)),

      Math.min(255, Math.round(g + factor * 10)),

      Math.max(0, Math.round(b - factor * 20)),

    ];

  } else if (factor < 0) {

    // 冷色：增加蓝，减少红

    const f = -factor;

    return [

      Math.max(0, Math.round(r - f * 20)),

      Math.max(0, Math.min(255, Math.round(g + f * 5))),

      Math.min(255, Math.round(b + f * 30)),

    ];

  }

  return [r, g, b];

}



// 移除背景（基于四角采样）

function removeImageBackground(
  pixels: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
  tolerance: number = 35
): Uint8ClampedArray<ArrayBuffer> {
  const result = new Uint8ClampedArray(pixels);

  // 1. 扫描四周边缘像素，量化后统计颜色频率
  const colorCount = new Map<string, { r: number; g: number; b: number; count: number }>();
  const quantize = (v: number) => Math.round(v / 16) * 16;

  const sampleEdge = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    const qr = quantize(pixels[idx]), qg = quantize(pixels[idx + 1]), qb = quantize(pixels[idx + 2]);
    const key = qr + "," + qg + "," + qb;
    const existing = colorCount.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCount.set(key, { r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2], count: 1 });
    }
  };

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 200))) {
      sampleEdge(x, y);
      if (y > 0) sampleEdge(x, height - 1 - y);
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 200))) {
      sampleEdge(x, y);
      if (x > 0) sampleEdge(width - 1 - x, y);
    }
  }

  // 2. 找占比最高的颜色作为背景色
  const totalEdgePixels = (width * 2 + height * 2);
  let bgColor = { r: 255, g: 255, b: 255 };
  let maxCount = 0;
  for (const entry of colorCount.values()) {
    if (entry.count > maxCount) {
      maxCount = entry.count;
      bgColor = entry;
    }
  }

  const bgRatio = maxCount / totalEdgePixels;
  if (bgRatio < 0.35) {
    return result;
  }

  // 3. Sobel 边缘检测（前景边缘保护）
  const edgeMap = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let c = 0; c < 3; c++) {
        const tl = pixels[((y-1)*width+(x-1))*4+c], tc = pixels[((y-1)*width+x)*4+c], tr = pixels[((y-1)*width+(x+1))*4+c];
        const ml = pixels[(y*width+(x-1))*4+c], mr = pixels[(y*width+(x+1))*4+c];
        const bl = pixels[((y+1)*width+(x-1))*4+c], bc = pixels[((y+1)*width+x)*4+c], br = pixels[((y+1)*width+(x+1))*4+c];
        gx += Math.abs(-tl + tr - 2*ml + 2*mr - bl + br);
        gy += Math.abs(-tl - 2*tc - tr + bl + 2*bc + br);
      }
      edgeMap[y * width + x] = gx + gy > 60 ? 1 : 0;
    }
  }

  // 4. 洪水填充：从四角向内扩展
  const bgMask = new Uint8Array(width * height);
  const queue: number[] = [];
  for (const [sx, sy] of [[0,0],[width-1,0],[0,height-1],[width-1,height-1]]) {
    const pos = sy * width + sx;
    if (!bgMask[pos]) { bgMask[pos] = 1; queue.push(pos); }
  }
  let qi = 0;
  while (qi < queue.length) {
    const pos = queue[qi++];
    const x = pos % width, y = Math.floor(pos / width);
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const npos = ny * width + nx;
      if (bgMask[npos] || edgeMap[npos]) continue;
      const idx = npos * 4;
      const dr = pixels[idx] - bgColor.r, dg = pixels[idx+1] - bgColor.g, db = pixels[idx+2] - bgColor.b;
      if (Math.sqrt(dr*dr + dg*dg + db*db) < tolerance) {
        bgMask[npos] = 1;
        queue.push(npos);
      }
    }
  }

  // 5. 应用：背景区域变白
  for (let i = 0; i < result.length; i += 4) {
    if (bgMask[i / 4]) {
      result[i] = 255; result[i + 1] = 255; result[i + 2] = 255;
    }
  }
  return result;
}



// 自动增强（分析图像直方图，自动调整亮度/对比度）

export function autoAnalyzeImage(

  imageElement: HTMLImageElement

): { brightness: number; contrast: number; sharpen: boolean } {

  const canvas = document.createElement('canvas');

  canvas.width = imageElement.naturalWidth;

  canvas.height = imageElement.naturalHeight;

  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(imageElement, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let totalBrightness = 0;

  let min = 255, max = 0;

  const len = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {

    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    totalBrightness += lum;

    if (lum < min) min = lum;

    if (lum > max) max = lum;

  }

  const avg = totalBrightness / len;

  const dynamicRange = max - min;

  // 亮度修正：太暗提亮，太亮压暗

  let brightness = 0;

  if (avg < 100) brightness = Math.round((100 - avg) * 0.4);

  else if (avg > 170) brightness = Math.round((170 - avg) * 0.3);

  // 对比度增强：动态范围小时加对比度

  let contrast = 0;

  if (dynamicRange < 150) contrast = Math.round((150 - dynamicRange) * 0.3);

  // 轮廓不够分明时建议锐化

  const sharpen = dynamicRange < 120;

  return { brightness: Math.max(-50, Math.min(50, brightness)), contrast: Math.max(-30, Math.min(50, contrast)), sharpen };

}



// 简化双边滤波（边缘保留降噪）

function bilateralFilter(

  pixels: Uint8ClampedArray<ArrayBuffer>,

  width: number,

  height: number,

  kernelSize: number = 3,

  sigmaColor: number = 30

): Uint8ClampedArray<ArrayBuffer> {

  const result = new Uint8ClampedArray(pixels.length);

  const half = Math.floor(kernelSize / 2);



  for (let y = 0; y < height; y++) {

    for (let x = 0; x < width; x++) {

      const idx = (y * width + x) * 4;

      const centerR = pixels[idx];

      const centerG = pixels[idx + 1];

      const centerB = pixels[idx + 2];



      let sumR = 0, sumG = 0, sumB = 0, totalWeight = 0;



      for (let ky = -half; ky <= half; ky++) {

        for (let kx = -half; kx <= half; kx++) {

          const ny = Math.min(height - 1, Math.max(0, y + ky));

          const nx = Math.min(width - 1, Math.max(0, x + kx));

          const nIdx = (ny * width + nx) * 4;



          const nr = pixels[nIdx];

          const ng = pixels[nIdx + 1];

          const nb = pixels[nIdx + 2];



          // 颜色相似度权重（核心：相似颜色才平均，不同颜色不混合）

          const colorDiff = Math.abs(centerR - nr) + Math.abs(centerG - ng) + Math.abs(centerB - nb);

          const weight = Math.exp(-(colorDiff * colorDiff) / (2 * sigmaColor * sigmaColor));



          sumR += nr * weight;

          sumG += ng * weight;

          sumB += nb * weight;

          totalWeight += weight;

        }

      }



      result[idx] = Math.round(sumR / totalWeight);

      result[idx + 1] = Math.round(sumG / totalWeight);

      result[idx + 2] = Math.round(sumB / totalWeight);

      result[idx + 3] = pixels[idx + 3];

    }

  }

  return result;

}



// 简单锐化（拉普拉斯算子）

// 高斯模糊（3x3，sigma≈1.2）

function gaussianBlur3x3(pixels: Uint8ClampedArray<ArrayBuffer>, width: number, height: number): Uint8ClampedArray<ArrayBuffer> {

  const kernel = [1/16, 2/16, 1/16, 2/16, 4/16, 2/16, 1/16, 2/16, 1/16];

  const result = new Uint8ClampedArray(pixels.length);

  for (let y = 0; y < height; y++) {

    for (let x = 0; x < width; x++) {

      for (let c = 0; c < 3; c++) {

        let sum = 0;

        for (let ky = -1; ky <= 1; ky++) {

          for (let kx = -1; kx <= 1; kx++) {

            const px = Math.min(width - 1, Math.max(0, x + kx));

            const py = Math.min(height - 1, Math.max(0, y + ky));

            sum += pixels[(py * width + px) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)];

          }

        }

        result[(y * width + x) * 4 + c] = Math.round(sum);

      }

      result[(y * width + x) * 4 + 3] = pixels[(y * width + x) * 4 + 3];

    }

  }

  return result;

}



// 锐化（Unsharp Mask，比卷积核更自然，不易产生光晕）

function sharpenImage(pixels: Uint8ClampedArray<ArrayBuffer>, width: number, height: number): Uint8ClampedArray<ArrayBuffer> {

  const blurred = gaussianBlur3x3(pixels, width, height);

  const result = new Uint8ClampedArray(pixels.length);

  const amount = 1.5; // 锐化强度

  for (let i = 0; i < pixels.length; i += 4) {

    for (let c = 0; c < 3; c++) {

      const diff = pixels[i + c] - blurred[i + c];

      result[i + c] = Math.max(0, Math.min(255, Math.round(pixels[i + c] + amount * diff)));

    }

    result[i + 3] = pixels[i + 3];

  }

  return result;

}



// 预处理主函数

function preprocessImage(

  pixels: Uint8ClampedArray<ArrayBuffer>,

  width: number,

  height: number,

  options: PreprocessOptions

): Uint8ClampedArray<ArrayBuffer> {

  let result = new Uint8ClampedArray(pixels);



  // 1. 降噪（双边滤波，保留边缘）

  if (options.denoise) {

    result = bilateralFilter(result, width, height, 3, 30);

  }



  // 2. 亮度调整（-100..+100，0=不变）

  if (options.brightness !== 0) {

    for (let i = 0; i < result.length; i += 4) {

      const [r, g, b] = adjustBrightness(result[i], result[i + 1], result[i + 2], options.brightness);

      result[i] = r;

      result[i + 1] = g;

      result[i + 2] = b;

    }

  }



  // 3. 对比度调整（-100..+100，0=不变）

  if (options.contrast !== 0) {

    for (let i = 0; i < result.length; i += 4) {

      const [r, g, b] = adjustContrast(result[i], result[i + 1], result[i + 2], options.contrast);

      result[i] = r;

      result[i + 1] = g;

      result[i + 2] = b;

    }

  }



  // 3. 饱和度调整（-100..+100，0=不变）

  if (options.saturation !== 0) {

    for (let i = 0; i < result.length; i += 4) {

      const [r, g, b] = adjustSaturation(result[i], result[i + 1], result[i + 2], options.saturation);

      result[i] = r;

      result[i + 1] = g;

      result[i + 2] = b;

    }

  }



  // 3.5 色温调整（-100..+100，0=不变）

  if (options.colorTemperature !== 0) {

    for (let i = 0; i < result.length; i += 4) {

      const [r, g, b] = adjustColorTemperature(result[i], result[i + 1], result[i + 2], options.colorTemperature);

      result[i] = r;

      result[i + 1] = g;

      result[i + 2] = b;

    }

  }



  // 3.6 移除背景

  if (options.removeBackground) {

    result = removeImageBackground(result, width, height);

  }



  // 4. 锐化（最后一步，增强轮廓）

  if (options.sharpen) {

    result = sharpenImage(result, width, height);

  }



  return result;

}



// ==================== 预处理独立函数 ====================



export interface PreprocessResult {

  canvas: HTMLCanvasElement;

  imageData: ImageData;

}



/**

 * 仅做预处理，返回处理后的 Canvas 和 ImageData

 * 用于两步流程：先预览预处理效果，再生成图纸

 */

export function preprocessImageOnly(

  imageElement: HTMLImageElement,

  preprocess: PreprocessOptions

): PreprocessResult {

  const width = imageElement.naturalWidth;

  const height = imageElement.naturalHeight;



  const canvas = document.createElement('canvas');

  canvas.width = width;

  canvas.height = height;

  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(imageElement, 0, 0);



  const hasPreprocess = preprocess.brightness !== 0 || preprocess.contrast !== 0 || preprocess.saturation !== 0 || preprocess.colorTemperature !== 0 || preprocess.sharpen || preprocess.denoise || preprocess.removeBackground;

  if (hasPreprocess) {

    const imageData = ctx.getImageData(0, 0, width, height);

    const processedPixels = preprocessImage(imageData.data, width, height, preprocess);

    ctx.putImageData(new ImageData(processedPixels, width, height), 0, 0);

  }



  return {

    canvas,

    imageData: ctx.getImageData(0, 0, width, height),

  };

}



// ==================== 铅笔素描（线稿） ====================



export interface SketchResult {

  canvas: HTMLCanvasElement;

}



export function generateSketch(imageElement: HTMLImageElement, strength: number = 1): SketchResult {

  const width = imageElement.naturalWidth;

  const height = imageElement.naturalHeight;



  const canvas = document.createElement('canvas');

  canvas.width = width;

  canvas.height = height;

  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(imageElement, 0, 0);



  const imageData = ctx.getImageData(0, 0, width, height);

  const data = imageData.data;



  const gray = new Uint8ClampedArray(width * height);

  for (let i = 0; i < data.length; i += 4) {

    gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

  }



  const inverted = new Uint8ClampedArray(width * height);

  for (let i = 0; i < gray.length; i++) {

    inverted[i] = 255 - gray[i];

  }



  const blurred = new Uint8ClampedArray(width * height);

  const radius = 3;

  for (let y = 0; y < height; y++) {

    for (let x = 0; x < width; x++) {

      let sum = 0, count = 0;

      for (let dy = -radius; dy <= radius; dy++) {

        for (let dx = -radius; dx <= radius; dx++) {

          const ny = y + dy, nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {

            const dist = (dx * dx + dy * dy) / (2 * radius * radius);

            const weight = Math.exp(-dist);

            sum += inverted[ny * width + nx] * weight;

            count += weight;

          }

        }

      }

      blurred[y * width + x] = Math.round(sum / count);

    }

  }



  const result = ctx.createImageData(width, height);

  for (let i = 0; i < gray.length; i++) {

    const b = blurred[i] / 255;

    let val;

    if (b >= 1) { val = 255; } else { val = Math.min(255, gray[i] / (1 - b)); }

    val = Math.round(gray[i] * (1 - strength) + val * strength);

    result.data[i * 4] = val;

    result.data[i * 4 + 1] = val;

    result.data[i * 4 + 2] = val;

    result.data[i * 4 + 3] = 255;

  }



  ctx.putImageData(result, 0, 0);

  return { canvas };

}





// ==================== 主函数 ====================



// 计算格子的代表色（参考 Zippland/perler-beads）

function calculateCellColor(

  imageData: ImageData,

  startX: number,

  startY: number,

  width: number,

  height: number,

  mode: 'dominant' | 'average' | 'smart' | 'sketch-guided',

  sketchCellValue?: number

): { r: number; g: number; b: number } | null {

  const data = imageData.data;

  const imgWidth = imageData.width;

  let rSum = 0, gSum = 0, bSum = 0;

  let pixelCount = 0;

  const colorCounts: Record<string, { r: number; g: number; b: number; count: number }> = {};

  let dominantColor: { r: number; g: number; b: number } | null = null;

  let maxCount = 0;



  const endX = startX + width;

  const endY = startY + height;



  for (let y = startY; y < endY; y++) {

    for (let x = startX; x < endX; x++) {

      const index = (y * imgWidth + x) * 4;

      if (data[index + 3] < 128) continue;



      const r = data[index];

      const g = data[index + 1];

      const b = data[index + 2];



      pixelCount++;



      if (mode === 'average') {

        rSum += r;

        gSum += g;

        bSum += b;

      } else {

        const colorKey = `${r},${g},${b}`;

        if (!colorCounts[colorKey]) {

          colorCounts[colorKey] = { r, g, b, count: 0 };

        }

        colorCounts[colorKey].count++;

        if (colorCounts[colorKey].count > maxCount) {

          maxCount = colorCounts[colorKey].count;

          dominantColor = { r, g, b };

        }

      }

    }

  }



  if (pixelCount === 0) return null;



  if (mode === 'average') {

    return {

      r: Math.round(rSum / pixelCount),

      g: Math.round(gSum / pixelCount),

      b: Math.round(bSum / pixelCount),

    };

  } else if (mode === 'sketch-guided') {

    // 线稿引导取色：用格子级线稿值判断是否为边缘

    // sketchCellValue: 0=黑(边缘) 255=白(非边缘)

    // 边缘格子：取主导色（保留线条颜色）

    // 非边缘格子：取平均色（平滑过渡）

    const isEdge = sketchCellValue !== undefined && sketchCellValue < 128;



    for (let y = startY; y < endY; y++) {

      for (let x = startX; x < endX; x++) {

        const index = (y * imgWidth + x) * 4;

        if (data[index + 3] < 128) continue;



        const r = data[index];

        const g = data[index + 1];

        const b = data[index + 2];



        if (isEdge) {

          // 边缘：取主导色

          const colorKey = `${r},${g},${b}`;

          if (!colorCounts[colorKey]) {

            colorCounts[colorKey] = { r, g, b, count: 0 };

          }

          colorCounts[colorKey].count++;

          if (colorCounts[colorKey].count > maxCount) {

            maxCount = colorCounts[colorKey].count;

            dominantColor = { r, g, b };

          }

        } else {

          // 非边缘：取平均色

          rSum += r;

          gSum += g;

          bSum += b;

          pixelCount++;

        }

      }

    }



    if (isEdge && dominantColor) {

      return dominantColor;

    } else if (pixelCount > 0) {

      return {

        r: Math.round(rSum / pixelCount),

        g: Math.round(gSum / pixelCount),

        b: Math.round(bSum / pixelCount),

      };

    }

    return null;

  } else {

    return dominantColor;

  }

}





// ==================== 主函数 ====================



export function generatePerlerPattern(

  imageElement: HTMLImageElement,

  options: PerlerOptions,

  preprocessedResult?: PreprocessResult

): { canvas: HTMLCanvasElement; stats: Record<string, number>; preprocessedCanvas?: HTMLCanvasElement; gridWidth: number; gridHeight: number; grid: string[][]; cellSize: number; padding: number } {

  const { gridSize, gridMode = 'maxEdge', palette: paletteId, mergeSimilar, removeBackground: doRemoveBg, dithering, pixelMode, preprocess, colorDistance: colorAlgo = 'oklab', keepAspectRatio = true, excludedColors = [], hollowCircle = true } = options;

  const palette = PALETTES[paletteId] || PALETTES.mard221;

  const filteredPalette = excludedColors.length > 0 ? palette.filter(c => !excludedColors.includes(c.id)) : palette;



  let gridWidth: number;

  let gridHeight: number;

  if (keepAspectRatio && imageElement.naturalWidth && imageElement.naturalHeight) {

    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;

    if (gridMode === 'height') {

      gridHeight = gridSize;

      gridWidth = Math.max(1, Math.round(gridSize * aspectRatio));

    } else {

      if (aspectRatio >= 1) {

        gridWidth = gridSize;

        gridHeight = Math.max(1, Math.round(gridSize / aspectRatio));

      } else {

        gridHeight = gridSize;

        gridWidth = Math.max(1, Math.round(gridSize * aspectRatio));

      }

    }

  } else {

    gridWidth = gridSize;

    gridHeight = gridSize;

  }



  const origWidth = imageElement.naturalWidth;

  const origHeight = imageElement.naturalHeight;



  const preprocessCanvas = document.createElement('canvas');

  preprocessCanvas.width = gridWidth;

  preprocessCanvas.height = gridHeight;

  const preprocessCtx = preprocessCanvas.getContext('2d')!;

  preprocessCtx.drawImage(imageElement, 0, 0, gridWidth, gridHeight);



  const srcCanvas = document.createElement('canvas');

  srcCanvas.width = origWidth;

  srcCanvas.height = origHeight;

  const srcCtx = srcCanvas.getContext('2d')!;

  srcCtx.drawImage(imageElement, 0, 0);



  let srcImageData: ImageData;

  if (preprocessedResult) {

    srcImageData = preprocessedResult.imageData;

    preprocessCtx.drawImage(preprocessedResult.canvas, 0, 0, gridWidth, gridHeight);

  } else {

    const hasPreprocess = preprocess.brightness !== 0 || preprocess.contrast !== 0 || preprocess.saturation !== 0 || preprocess.colorTemperature !== 0 || preprocess.sharpen || preprocess.denoise || preprocess.removeBackground;

    if (hasPreprocess) {

      const origImageData = srcCtx.getImageData(0, 0, origWidth, origHeight);

      const processedPixels = preprocessImage(origImageData.data, origWidth, origHeight, preprocess);

      srcCtx.putImageData(new ImageData(processedPixels, origWidth, origHeight), 0, 0);

      preprocessCtx.putImageData(new ImageData(processedPixels, origWidth, origHeight), 0, 0);

    }

    srcImageData = srcCtx.getImageData(0, 0, origWidth, origHeight);

  }



  // 生成线稿数据（用于 sketch-guided 模式）

  // 使用暗像素优先的缩放，直接生成 gridWidth × gridHeight 的线稿

  // 这样预览和算法用的是同一份数据

  let sketchGrid: Uint8ClampedArray | undefined;

  if (pixelMode === 'sketch-guided' || pixelMode === 'smart') {

    const sketchResult = generateSketch(imageElement, 1);

    const sketchCtx = sketchResult.canvas.getContext('2d')!;

    const sketchImgData = sketchCtx.getImageData(0, 0, origWidth, origHeight);

    const srcSketchData = sketchImgData.data;

    // 暗像素优先下采样到 grid 尺寸

    sketchGrid = new Uint8ClampedArray(gridWidth * gridHeight);

    const sx = origWidth / gridWidth;

    const sy = origHeight / gridHeight;

    for (let gy = 0; gy < gridHeight; gy++) {

      for (let gx = 0; gx < gridWidth; gx++) {

        const x0 = Math.floor(gx * sx);

        const y0 = Math.floor(gy * sy);

        const x1 = Math.min(Math.floor((gx + 1) * sx), origWidth);

        const y1 = Math.min(Math.floor((gy + 1) * sy), origHeight);

        // 区域内取加权均值（深色权重高，浅色权重低）

        let wSum = 0, wTotal = 0;

        for (let py = y0; py < y1; py++) {

          for (let px = x0; px < x1; px++) {

            const idx = (py * origWidth + px) * 4;

            const r = srcSketchData[idx], g = srcSketchData[idx+1], b = srcSketchData[idx+2];

            const lum = r * 0.299 + g * 0.587 + b * 0.114;

            const w = 255 - lum;

            wSum += lum * w;

            wTotal += w;

          }

        }

        sketchGrid[gy * gridWidth + gx] = wTotal > 0 ? Math.round(wSum / wTotal) : 255;

      }

    }

  }



  const cellWidth = origWidth / gridWidth;

  const cellHeight = origHeight / gridHeight;



  let grid: string[][];



  if (dithering) {

    const floatPixels = new Float64Array(gridWidth * gridHeight * 3);

    for (let y = 0; y < gridHeight; y++) {

      for (let x = 0; x < gridWidth; x++) {

        const startX = Math.floor(x * cellWidth);

        const startY = Math.floor(y * cellHeight);

        const endX = Math.min(origWidth, Math.ceil((x + 1) * cellWidth));

        const endY = Math.min(origHeight, Math.ceil((y + 1) * cellHeight));

        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        for (let sy = startY; sy < endY; sy++) {

          for (let sx = startX; sx < endX; sx++) {

            const idx = (sy * origWidth + sx) * 4;

            if (srcImageData.data[idx + 3] < 128) continue;

            rSum += srcImageData.data[idx];

            gSum += srcImageData.data[idx + 1];

            bSum += srcImageData.data[idx + 2];

            count++;

          }

        }

        const baseIdx = (y * gridWidth + x) * 3;

        if (count > 0) {

          floatPixels[baseIdx] = rSum / count;

          floatPixels[baseIdx + 1] = gSum / count;

          floatPixels[baseIdx + 2] = bSum / count;

        }

      }

    }

    grid = applyDithering(floatPixels, gridWidth, gridHeight, filteredPalette, colorAlgo);

  } else if (pixelMode === 'enhanced') {

    // === Enhanced mode: dual downsampling + edge refinement + clustering ===



    // Pass 1: Smooth downsampling (for accurate colors)

    const smoothCanvas = document.createElement('canvas');

    smoothCanvas.width = gridWidth;

    smoothCanvas.height = gridHeight;

    const smoothCtx = smoothCanvas.getContext('2d')!;

    smoothCtx.imageSmoothingEnabled = true;

    smoothCtx.imageSmoothingQuality = 'high';

    smoothCtx.drawImage(srcCanvas, 0, 0, gridWidth, gridHeight);

    const smoothData = smoothCtx.getImageData(0, 0, gridWidth, gridHeight).data;



    // Pass 2: Nearest neighbor downsampling (for sharp edges)

    const nnCanvas = document.createElement('canvas');

    nnCanvas.width = gridWidth;

    nnCanvas.height = gridHeight;

    const nnCtx = nnCanvas.getContext('2d')!;

    nnCtx.imageSmoothingEnabled = false;

    nnCtx.drawImage(srcCanvas, 0, 0, gridWidth, gridHeight);

    const nnData = nnCtx.getImageData(0, 0, gridWidth, gridHeight).data;



    // Per-pixel selection: smooth for gradients, NN for edges

    const enhancedPixels = new Uint8ClampedArray(gridWidth * gridHeight * 4);

    for (let i = 0; i < gridWidth * gridHeight; i++) {

      const pi = i * 4;

      const sR = smoothData[pi], sG = smoothData[pi + 1], sB = smoothData[pi + 2], sA = smoothData[pi + 3];

      const nR = nnData[pi], nG = nnData[pi + 1], nB = nnData[pi + 2];



      const sLab = rgbToLab(sR, sG, sB);

      const nLab = rgbToLab(nR, nG, nB);

      const detailDelta = deltaE76(sLab, nLab);



      const sChroma = Math.sqrt(sLab.a * sLab.a + sLab.b * sLab.b);

      const nChroma = Math.sqrt(nLab.a * nLab.a + nLab.b * nLab.b);



      // Edge detail: NN is darker or more vivid

      const preferNn = sA >= 220 && detailDelta >= 18 && (nLab.L < sLab.L - 5 || nChroma > sChroma + 5);

      // Highlight detail: NN is brighter

      const preferBrightNn = sA >= 220 && detailDelta >= 20 && nLab.L > sLab.L + 22;

      // Needs refinement: has detail difference or dark region

      const shouldRefine = sA >= 180 && (detailDelta >= 4 || sLab.L < 30 || (sLab.L > 60 && nLab.L > 60));



      if (preferNn || preferBrightNn) {

        enhancedPixels[pi] = nR; enhancedPixels[pi + 1] = nG; enhancedPixels[pi + 2] = nB; enhancedPixels[pi + 3] = sA;

      } else {

        enhancedPixels[pi] = sR; enhancedPixels[pi + 1] = sG; enhancedPixels[pi + 2] = sB; enhancedPixels[pi + 3] = sA;

      }

      // Mark for refinement using a flag array

      if (shouldRefine) enhancedPixels[pi + 3] = enhancedPixels[pi + 3] | 0; // keep alpha, track via separate flag

    }



    // Build enhanced grid using clustering

    grid = [];

    for (let y = 0; y < gridHeight; y++) {

      const row: string[] = [];

      for (let x = 0; x < gridWidth; x++) {

        const pi = (y * gridWidth + x) * 4;

        const alpha = enhancedPixels[pi + 3];

        if (alpha < 128) { row.push('BG'); continue; }

        const startX = Math.floor(x * cellWidth);

        const startY = Math.floor(y * cellHeight);

        const cellSpan = Math.max(cellWidth, cellHeight);

        // Use clustering for better accuracy when cell is large enough

        let representative = cellSpan >= 4

          ? _clusterCellColor(srcImageData, startX, startY, Math.ceil(cellWidth), Math.ceil(cellHeight), cellSpan)

          : null;

        if (!representative) {

          representative = { r: enhancedPixels[pi], g: enhancedPixels[pi + 1], b: enhancedPixels[pi + 2] };

        }

        const color = findClosestColor(representative.r, representative.g, representative.b, filteredPalette, colorAlgo);

        row.push(color.id);

      }

      grid.push(row);

    }

  } else if (pixelMode === 'smart') {
    // === Smart mode: adaptive sampling + Lab clustering (pindou.top-style) ===
    grid = [];
    for (let y = 0; y < gridHeight; y++) {
      const row: string[] = [];
      for (let x = 0; x < gridWidth; x++) {
        const startX = Math.floor(x * cellWidth);
        const startY = Math.floor(y * cellHeight);
        const cellW = Math.ceil(cellWidth);
        const cellH = Math.ceil(cellHeight);

        const sketchCellValue = sketchGrid ? sketchGrid[y * gridWidth + x] : undefined;
        const representative = smartSampleCell(srcImageData, startX, startY, cellW, cellH, origWidth, origHeight, sketchCellValue);
        if (!representative) { row.push('BG'); continue; }

        const color = findClosestColor(representative.r, representative.g, representative.b, filteredPalette, colorAlgo);
        row.push(color.id);
      }
      grid.push(row);
    }
  } else {
    grid = [];
    for (let y = 0; y < gridHeight; y++) {
      const row: string[] = [];
      for (let x = 0; x < gridWidth; x++) {
        const startX = Math.floor(x * cellWidth);
        const startY = Math.floor(y * cellHeight);
        const endX = Math.min(origWidth, Math.ceil((x + 1) * cellWidth));
        const endY = Math.min(origHeight, Math.ceil((y + 1) * cellHeight));
        const sketchCellValue = sketchGrid ? sketchGrid[y * gridWidth + x] : undefined;
        const representative = calculateCellColor(srcImageData, startX, startY, endX - startX, endY - startY, pixelMode, sketchCellValue);
        if (!representative) { row.push('BG'); continue; }
        const color = findClosestColor(representative.r, representative.g, representative.b, filteredPalette, colorAlgo);
        row.push(color.id);
      }
      grid.push(row);
    }
  }



  let finalGrid = mergeSimilar ? mergeRegions(grid, 3) : grid;



  if (doRemoveBg) {

    const bgColor = finalGrid[0][0];

    if (bgColor !== 'BG') {

      const visited = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(false));

      const queue: [number, number][] = [];

      for (let x = 0; x < gridWidth; x++) { if (finalGrid[0][x] === bgColor) { queue.push([x, 0]); visited[0][x] = true; } if (finalGrid[gridHeight - 1][x] === bgColor) { queue.push([x, gridHeight - 1]); visited[gridHeight - 1][x] = true; } }

      for (let y = 0; y < gridHeight; y++) { if (finalGrid[y][0] === bgColor && !visited[y][0]) { queue.push([0, y]); visited[y][0] = true; } if (finalGrid[y][gridWidth - 1] === bgColor && !visited[y][gridWidth - 1]) { queue.push([gridWidth - 1, y]); visited[y][gridWidth - 1] = true; } }

      while (queue.length > 0) {

        const [cx, cy] = queue.shift()!;

        finalGrid[cy][cx] = 'BG';

        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {

          const nx = cx + dx, ny = cy + dy;

          if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && !visited[ny][nx] && finalGrid[ny][nx] === bgColor) { visited[ny][nx] = true; queue.push([nx, ny]); }

        }

      }

    }

  }



  const cellSize = 20;

  const padding = 40;

  const outputWidth = gridWidth * cellSize + padding * 2;

  const outputHeight = gridHeight * cellSize + padding * 2;

  const output = document.createElement('canvas');

  output.width = outputWidth;

  output.height = outputHeight;

  const outCtx = output.getContext('2d')!;

  outCtx.fillStyle = '#ffffff';

  outCtx.fillRect(0, 0, outputWidth, outputHeight);



  const colorMap = new Map<string, PerlerColor>();

  for (const c of filteredPalette) colorMap.set(c.id, c);



  const stats: Record<string, number> = {};



  for (let y = 0; y < gridHeight; y++) {

    for (let x = 0; x < gridWidth; x++) {

      const colorId = finalGrid[y][x];

      if (colorId === 'BG') continue;

      const color = colorMap.get(colorId);

      if (!color) continue;



      const px = padding + x * cellSize;

      const py = padding + y * cellSize;

      const cx = px + cellSize / 2;

      const cy = py + cellSize / 2;

      const outerRadius = cellSize / 2 - 1;



      if (hollowCircle) {

        const innerRadius = outerRadius * 0.5;

        outCtx.beginPath();

        outCtx.arc(cx, cy, outerRadius, 0, Math.PI * 2);

        outCtx.fillStyle = color.hex;

        outCtx.fill();

        outCtx.strokeStyle = '#cccccc';

        outCtx.lineWidth = 0.5;

        outCtx.stroke();

        outCtx.beginPath();

        outCtx.arc(cx, cy, innerRadius, 0, Math.PI * 2);

        outCtx.fillStyle = '#ffffff';

        outCtx.fill();

      } else {

        outCtx.beginPath();

        outCtx.arc(cx, cy, outerRadius, 0, Math.PI * 2);

        outCtx.fillStyle = color.hex;

        outCtx.fill();

        outCtx.strokeStyle = '#cccccc';

        outCtx.lineWidth = 0.5;

        outCtx.stroke();

      }



      const [r, g, b] = hexToRgb(color.hex);

      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      outCtx.fillStyle = brightness > 128 ? '#000000' : '#ffffff';

      outCtx.font = '8px Arial';

      outCtx.textAlign = 'center';

      outCtx.textBaseline = 'middle';

      outCtx.fillText(colorId, cx, cy);



      stats[colorId] = (stats[colorId] || 0) + 1;

    }

  }



  return { canvas: output, stats, preprocessedCanvas: preprocessCanvas, gridWidth, gridHeight, grid: finalGrid, cellSize, padding };

}



// ==================== 采购清单 ====================



export function generateShoppingList(

  stats: Record<string, number>,

  paletteId: string

): { color: PerlerColor; count: number }[] {

  const palette = PALETTES[paletteId] || PALETTES.mard221;

  const colorMap = new Map<string, PerlerColor>();

  for (const c of palette) colorMap.set(c.id, c);



  return Object.entries(stats)

    .map(([id, count]) => ({

      color: colorMap.get(id)!,

      count,

    }))

    .filter(item => item.color && item.count > 0)

    .sort((a, b) => b.count - a.count);

}



// ==================== 颜色统计 ====================



export function getColorStats(

  grid: string[][],

  paletteId: string

): { colorId: string; hex: string; count: number; percentage: number }[] {

  const palette = PALETTES[paletteId] || PALETTES.mard221;

  const colorMap = new Map<string, PerlerColor>();

  for (const c of palette) colorMap.set(c.id, c);



  const counts: Record<string, number> = {};

  let total = 0;

  for (const row of grid) {

    for (const cell of row) {

      if (cell === 'BG') continue;

      counts[cell] = (counts[cell] || 0) + 1;

      total++;

    }

  }



  return Object.entries(counts)

    .map(([id, count]) => ({

      colorId: id,

      hex: colorMap.get(id)?.hex || '#000000',

      count,

      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,

    }))

    .sort((a, b) => b.count - a.count);

}



// ==================== 编辑功能 ====================



export function paintPixel(

  grid: string[][],

  row: number,

  col: number,

  colorId: string

): { grid: string[][]; changed: boolean } {

  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {

    return { grid, changed: false };

  }

  if (grid[row][col] === colorId) {

    return { grid, changed: false };

  }

  const newGrid = grid.map(r => [...r]);

  newGrid[row][col] = colorId;

  return { grid: newGrid, changed: true };

}



export function floodFillErase(

  grid: string[][],

  startRow: number,

  startCol: number

): string[][] {

  const target = grid[startRow]?.[startCol];

  if (!target || target === 'BG') return grid;



  const newGrid = grid.map(r => [...r]);

  const height = grid.length;

  const width = grid[0].length;

  const visited = Array.from({ length: height }, () => Array(width).fill(false));

  const queue: [number, number][] = [[startCol, startRow]];

  visited[startRow][startCol] = true;



  while (queue.length > 0) {

    const [x, y] = queue.shift()!;

    newGrid[y][x] = 'BG';

    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {

      const nx = x + dx, ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx] && grid[ny][nx] === target) {

        visited[ny][nx] = true;

        queue.push([nx, ny]);

      }

    }

  }

  return newGrid;

}



export function replaceColor(

  grid: string[][],

  oldColorId: string,

  newColorId: string

): string[][] {

  return grid.map(row => row.map(cell => cell === oldColorId ? newColorId : cell));

}



export function getFilteredPalette(paletteId: string, excludedColors: string[]): PerlerColor[] {

  const palette = PALETTES[paletteId] || PALETTES.mard221;

  return excludedColors.length > 0 ? palette.filter(c => !excludedColors.includes(c.id)) : palette;

}



// ==================== Smart Sampling Mode (pindou.top-style) ====================

/**
 * 智能取色函数：参考 pindou.top 的 _sampleCellRepresentative 算法
 * 在原图对应区域做自适应网格采样，Lab 空间聚类，保留细节特征
 */
function smartSampleCell(
  imageData: ImageData,
  startX: number,
  startY: number,
  cellW: number,
  cellH: number,
  imgW: number,
  imgH: number,
  sketchCellValue?: number
): { r: number; g: number; b: number } | null {
  const data = imageData.data;
  const endX = Math.min(startX + cellW, imgW);
  const endY = Math.min(startY + cellH, imgH);

  // 自适应采样网格：根据区域大小决定采样密度
  const cellSpan = Math.max(cellW, cellH);
  const sampleGrid = cellSpan >= 20 ? 6 : cellSpan >= 12 ? 5 : cellSpan >= 6 ? 4 : 3;
  // 最多 6×6=36 个采样点

  interface SmartSample { r: number; g: number; b: number; weight: number; row: number; col: number }
  const samples: SmartSample[] = [];

  for (let sy = 0; sy < sampleGrid; sy++) {
    for (let sx = 0; sx < sampleGrid; sx++) {
      const px = startX + Math.floor((sx + 0.5) * cellW / sampleGrid);
      const py = startY + Math.floor((sy + 0.5) * cellH / sampleGrid);
      if (px >= imgW || py >= imgH) continue;

      const idx = (py * imgW + px) * 4;
      if (data[idx + 3] < 128) continue; // 跳过透明像素

      // 中心权重：越靠近中心权重越高
      const cx = (sx + 0.5) / sampleGrid - 0.5;
      const cy = (sy + 0.5) / sampleGrid - 0.5;
      const centerDist = Math.min(1, Math.sqrt(cx * cx + cy * cy) * 2);
      const weight = 0.7 + 0.6 * (1 - centerDist);

      samples.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        weight,
        row: sy,
        col: sx,
      });
    }
  }

  if (samples.length === 0) return null;
  if (samples.length === 1) return { r: samples[0].r, g: samples[0].g, b: samples[0].b };

  // Lab 空间贪心聚类（deltaE76 阈值 18）
  const CLUSTER_THRESHOLD = 18;
  interface SmartCluster {
    samples: SmartSample[];
    totalWeight: number;
    lab: { L: number; a: number; b: number };
  }
  const clusters: SmartCluster[] = [];

  for (const sp of samples) {
    const lab = rgbToLab(sp.r, sp.g, sp.b);
    let merged = false;
    for (const cl of clusters) {
      if (deltaE76(lab, cl.lab) < CLUSTER_THRESHOLD) {
        cl.samples.push(sp);
        cl.totalWeight += sp.weight;
        // 更新聚类中心（加权移动平均）
        const n = cl.samples.length;
        cl.lab.L = ((n - 1) * cl.lab.L + lab.L) / n;
        cl.lab.a = ((n - 1) * cl.lab.a + lab.a) / n;
        cl.lab.b = ((n - 1) * cl.lab.b + lab.b) / n;
        merged = true;
        break;
      }
    }
    if (!merged) {
      clusters.push({ samples: [sp], totalWeight: sp.weight, lab: { ...lab } });
    }
  }

  // 按权重降序排列
  clusters.sort((a, b) => b.totalWeight - a.totalWeight);

  // 计算各聚类的加权平均 RGB
  const clusterColors = clusters.map(cl => {
    let rSum = 0, gSum = 0, bSum = 0, wSum = 0;
    for (const sp of cl.samples) {
      rSum += sp.r * sp.weight;
      gSum += sp.g * sp.weight;
      bSum += sp.b * sp.weight;
      wSum += sp.weight;
    }
    return {
      r: rSum / wSum,
      g: gSum / wSum,
      b: bSum / wSum,
      weight: cl.totalWeight,
      lab: cl.lab,
      count: cl.samples.length,
    };
  });

  // 全局加权平均
  let aR = 0, aG = 0, aB = 0, aW = 0;
  for (const sp of samples) {
    aR += sp.r * sp.weight;
    aG += sp.g * sp.weight;
    aB += sp.b * sp.weight;
    aW += sp.weight;
  }
  aR /= aW; aG /= aW; aB /= aW;

  // 特殊情况处理
  const dominant = clusterColors[0];
  const domLab = dominant.lab;
  const avgLab = rgbToLab(Math.round(aR), Math.round(aG), Math.round(aB));
  const domRatio = dominant.weight / aW;

  // 线稿边缘判断
  const isEdge = sketchCellValue !== undefined && sketchCellValue < 128;

  // ① 白底上的细笔画/深色特征保留
  //    主导聚类是白色/浅色，但有少量深色采样点
  //    边缘格降低阈值（5% vs 12%），更容易保留线条
  if (domLab.L >= 85 && clusters.length >= 2) {
    const secondary = clusterColors[1];
    if (secondary.lab.L < 40) {
      const edgeThreshold = isEdge ? 0.05 : 0.12;
      if (secondary.weight / aW >= edgeThreshold) {
        return { r: Math.round(secondary.r), g: Math.round(secondary.g), b: Math.round(secondary.b) };
      }
    }
  }

  // ② 深色区域中的白色高光保留
  //    主导聚类是深色，但有少量亮色采样点
  if (domLab.L <= 35 && clusters.length >= 2) {
    const secondary = clusterColors[1];
    if (secondary.lab.L > 70) {
      if (secondary.weight / aW >= 0.1) {
        return { r: Math.round(secondary.r), g: Math.round(secondary.g), b: Math.round(secondary.b) };
      }
    }
  }

  // ③ 如果主导聚类足够突出，使用主导聚类
  if (domRatio >= 0.55) {
    return { r: Math.round(dominant.r), g: Math.round(dominant.g), b: Math.round(dominant.b) };
  }

  // ④ 默认：使用全局加权平均
  return { r: Math.round(aR), g: Math.round(aG), b: Math.round(aB) };
}

// ==================== Enhanced Mode: Lab/Clustering Helper Functions ====================



// sRGB to linear (gamma decode)

function _srgbToLinear(c: number): number {

  const v = c / 255;

  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

}



// Linear to sRGB (gamma encode)

function _linearToSrgb(v: number): number {

  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;

  return Math.max(0, Math.min(255, Math.round(c * 255)));

}



// RGB to CIE Lab (D65 illuminant)

function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {

  // sRGB -> linear RGB

  let lr = _srgbToLinear(r), lg = _srgbToLinear(g), lb = _srgbToLinear(b);

  // Linear RGB -> XYZ (sRGB D65 matrix)

  let x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;

  let y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;

  let z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  // D65 white point

  x /= 0.95047; y /= 1.0; z /= 1.08883;

  // XYZ -> Lab

  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);

  const fx = f(x), fy = f(y), fz = f(z);

  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };

}



// Delta-E 76 (Euclidean in Lab)

function deltaE76(c1: { L: number; a: number; b: number }, c2: { L: number; a: number; b: number }): number {

  return Math.sqrt((c1.L - c2.L) ** 2 + (c1.a - c2.a) ** 2 + (c1.b - c2.b) ** 2);

}



// Fine-grained sampling from original image for a single cell

function _sampleCellRepresentative(

  imageData: ImageData, startX: number, startY: number, cellW: number, cellH: number, imgW: number, imgH: number

): { r: number; g: number; b: number } | null {

  const data = imageData.data;

  let rSum = 0, gSum = 0, bSum = 0, count = 0;

  const endX = Math.min(startX + cellW, imgW);

  const endY = Math.min(startY + cellH, imgH);

  for (let y = startY; y < endY; y++) {

    for (let x = startX; x < endX; x++) {

      const idx = (y * imgW + x) * 4;

      if (data[idx + 3] < 128) continue;

      rSum += data[idx]; gSum += data[idx + 1]; bSum += data[idx + 2]; count++;

    }

  }

  return count > 0 ? { r: rSum / count, g: gSum / count, b: bSum / count } : null;

}



// Clustering-based cell color extraction with multi-layer feature protection

function _clusterCellColor(

  imageData: ImageData, startX: number, startY: number, cellW: number, cellH: number, cellSpan: number

): { r: number; g: number; b: number } | null {

  const imgW = imageData.width;

  const imgH = imageData.height;

  const endX = Math.min(startX + cellW, imgW);

  const endY = Math.min(startY + cellH, imgH);



  // Step 4a: Sub-sampling with center weighting

  const sampleGrid = cellSpan >= 12 ? 6 : cellSpan >= 8 ? 5 : cellSpan >= 4 ? 4 : 3;

  interface SamplePoint { r: number; g: number; b: number; weight: number; row: number; col: number }

  const samples: SamplePoint[] = [];

  const cellData = imageData.data;

  for (let sy = 0; sy < sampleGrid; sy++) {

    for (let sx = 0; sx < sampleGrid; sx++) {

      const px = startX + Math.floor((sx + 0.5) * cellW / sampleGrid);

      const py = startY + Math.floor((sy + 0.5) * cellH / sampleGrid);

      if (px >= imgW || py >= imgH) continue;

      const idx = (py * imgW + px) * 4;

      if (cellData[idx + 3] < 128) continue;

      // Center weight: 0.7 + 0.6 * centerDistance

      const cx = (sx + 0.5) / sampleGrid - 0.5;

      const cy = (sy + 0.5) / sampleGrid - 0.5;

      const centerDist = Math.min(1, Math.sqrt(cx * cx + cy * cy) * 2);

      samples.push({ r: cellData[idx], g: cellData[idx + 1], b: cellData[idx + 2], weight: 0.7 + 0.6 * (1 - centerDist), row: sy, col: sx });

    }

  }

  if (samples.length === 0) return null;



  // Step 4b: Clustering (Delta-E 76, threshold 18)

  interface Cluster { samples: SamplePoint[]; totalWeight: number; lab: { L: number; a: number; b: number } }

  const clusters: Cluster[] = [];

  const CLUSTER_THRESHOLD = 18;



  for (const sp of samples) {

    const lab = rgbToLab(sp.r, sp.g, sp.b);

    let merged = false;

    for (const cl of clusters) {

      if (deltaE76(lab, cl.lab) < CLUSTER_THRESHOLD) {

        cl.samples.push(sp);

        cl.totalWeight += sp.weight;

        // Update cluster center (weighted)

        const n = cl.samples.length;

        cl.lab.L = ((n - 1) * cl.lab.L + lab.L) / n;

        cl.lab.a = ((n - 1) * cl.lab.a + lab.a) / n;

        cl.lab.b = ((n - 1) * cl.lab.b + lab.b) / n;

        merged = true;

        break;

      }

    }

    if (!merged) {

      clusters.push({ samples: [sp], totalWeight: sp.weight, lab: { ...lab } });

    }

  }



  // Sort by weight descending

  clusters.sort((a, b) => b.totalWeight - a.totalWeight);



  // Dominant cluster

  const dominant = clusters[0];

  let dR = 0, dG = 0, dB = 0;

  let dWTotal = 0;

  for (const sp of dominant.samples) {

    dR += sp.r * sp.weight; dG += sp.g * sp.weight; dB += sp.b * sp.weight; dWTotal += sp.weight;

  }

  dR /= dWTotal; dG /= dWTotal; dB /= dWTotal;



  // All-sample weighted average

  let aR = 0, aG = 0, aB = 0, aWTotal = 0;

  for (const sp of samples) {

    aR += sp.r * sp.weight; aG += sp.g * sp.weight; aB += sp.b * sp.weight; aWTotal += sp.weight;

  }

  aR /= aWTotal; aG /= aWTotal; aB /= aWTotal;



  // Dominant cluster statistics

  const dLab = rgbToLab(Math.round(dR), Math.round(dG), Math.round(dB));

  const dLum = dLab.L;

  const dChroma = Math.sqrt(dLab.a * dLab.a + dLab.b * dLab.b);

  const dRatio = dominant.totalWeight / aWTotal;



  // Overall cell statistics

  const avgLab = rgbToLab(Math.round(aR), Math.round(aG), Math.round(aB));

  const avgLum = avgLab.L;

  const avgChroma = Math.sqrt(avgLab.a * avgLab.a + avgLab.b * avgLab.b);



  // Row/col span of dominant cluster

  let minRow = sampleGrid, maxRow = 0, minCol = sampleGrid, maxCol = 0;

  for (const sp of dominant.samples) {

    if (sp.row < minRow) minRow = sp.row;

    if (sp.row > maxRow) maxRow = sp.row;

    if (sp.col < minCol) minCol = sp.col;

    if (sp.col > maxCol) maxCol = sp.col;

  }

  const rowSpan = maxRow - minRow + 1;

  const colSpan = maxCol - minCol + 1;



  // Dark/vibrant sample ratios and center scores

  let darkCount = 0, vibrantCount = 0, centerDarkW = 0, centerVibrantW = 0, centerTotalW = 0;

  for (const sp of samples) {

    const spLab = rgbToLab(sp.r, sp.g, sp.b);

    const spChroma = Math.sqrt(spLab.a * spLab.a + spLab.b * spLab.b);

    const cx = (sp.col + 0.5) / sampleGrid - 0.5;

    const cy = (sp.row + 0.5) / sampleGrid - 0.5;

    const centerDist = Math.sqrt(cx * cx + cy * cy);

    const isCenter = centerDist < 0.4;

    if (spLab.L < 34) { darkCount++; if (isCenter) centerDarkW += sp.weight; }

    if (spChroma > 30) { vibrantCount++; if (isCenter) centerVibrantW += sp.weight; }

    if (isCenter) centerTotalW += sp.weight;

  }

  const darkRatio = darkCount / samples.length;

  const vibrantRatio = vibrantCount / samples.length;

  const darkCenterScore = centerTotalW > 0 ? centerDarkW / centerTotalW : 0;

  const vibrantCenterScore = centerTotalW > 0 ? centerVibrantW / centerTotalW : 0;



  // Contrast between dominant and overall

  const contrastDelta = Math.abs(dLum - avgLum);

  const chromaDiff = Math.abs(dChroma - avgChroma);



  // Step 4c: Multi-layer feature protection (priority cascade)

  // ① White bg thin lines/text

  if (dLum >= 92 && dChroma <= 8 && avgLum >= 82) {

    return { r: dR, g: dG, b: dB };

  }

  // ② White bg small features (eyes, nose)

  if (dLum >= 92 && avgLum >= 72) {

    return { r: dR, g: dG, b: dB };

  }

  // ③ Dark bg highlights (eye reflections)

  if (dLum <= 40 && dChroma <= 24) {

    return { r: dR, g: dG, b: dB };

  }

  // ④ Neutral bg horizontal lines (whiskers)

  if (dLum >= 38 && dLum <= 88 && dChroma <= 18) {

    return { r: dR, g: dG, b: dB };

  }

  // ⑤ Dark compact features

  if (rowSpan <= 5 && colSpan <= 5 && dLum <= 34) {

    return { r: dR, g: dG, b: dB };

  }

  // ⑥ Pure black regions

  if (dLum <= 10 && dRatio >= 0.72) {

    return { r: dR, g: dG, b: dB };

  }

  // ⑦ Dark center regions

  if (darkRatio >= 0.22 && darkCenterScore >= 0.42 && contrastDelta >= 18) {

    return { r: dR, g: dG, b: dB };

  }

  // ⑧ Vibrant center regions

  if (vibrantRatio >= 0.22 && vibrantCenterScore >= 0.42 && chromaDiff >= 12) {

    return { r: dR, g: dG, b: dB };

  }

  // ⑨ Fallback: dominant cluster if dominant enough, else weighted average

  const avgDist = deltaE76(dLab, avgLab);

  if (dRatio >= 0.58 && avgDist <= 10) {

    return { r: dR, g: dG, b: dB };

  }

  return { r: aR, g: aG, b: aB };

}

