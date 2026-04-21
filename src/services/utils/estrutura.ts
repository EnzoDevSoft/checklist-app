import AsyncStorage from "@react-native-async-storage/async-storage"

export const estruturaPadrao: Record<string, string[]> = {
  "Área Externa": [
    "Fachada limpa e conservada",
    "Placas e comunicação visível",
    "Calçada limpa e segura",
    "Vitrines organizadas e atualizadas",
    "Portas e vidros limpos",
    "Materiais promocionais visíveis",
  ],
  "Área de Vendas (Interna)": [
    "Iluminação adequada",
    "Ar-condicionado funcionando",
    "Piso limpo e conservado",
    "Tapete em boas condições",
    "Cestos abastecidos e com preço",
    "Prateleiras limpas",
    "Produtos alinhados (frente correta)",
    "Espaços vazios (rupturas)",
    "Etiquetas de preço corretas",
    "Balcão organizado",
    "Câmeras funcionando",
  ],
  "Conservação de Produtos": [
    "Geladeiras funcionando corretamente",
    "Temperatura controlada",
    "Freezers (sorvetes, etc.)",
    "Produtos armazenados corretamente",
    "Controle de validade visível",
  ],
  "Área Técnica / Sanitária": [
    "Cozinha limpa",
    "Geladeiras internas organizadas",
    "Micro-ondas limpo",
    "Água disponível",
    "Banheiros limpos e abastecidos",
    "Sala de motoboys organizada",
  ],
  "Equipe": [
    "Funcionários com crachá",
    "Uniforme completo",
    "Aparência adequada",
    "Postura profissional",
    "Equipe completa no turno",
  ],
}

export async function getEstrutura(): Promise<Record<string, string[]>> {
  try {
    const salvo = await AsyncStorage.getItem("@topicos_checklist")
    return salvo ? JSON.parse(salvo) : estruturaPadrao
  } catch {
    return estruturaPadrao
  }
}

export async function salvarEstrutura(nova: Record<string, string[]>): Promise<void> {
  await AsyncStorage.setItem("@topicos_checklist", JSON.stringify(nova))
}
