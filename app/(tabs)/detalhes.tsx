import { useLocalSearchParams } from "expo-router"
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from "react-native"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"

type Dados = Record<string, number>

const estrutura = {
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

export default function Detalhes() {
  const params = useLocalSearchParams()
  const dados: Dados = JSON.parse(params.dados as string)
  const auditor = (params.auditor as string) || ""
  const responsavel = (params.responsavel as string) || ""
  const loja = (params.loja as string) || ""
  const data = (params.data as string) || ""

  let soma = 0
  let total = 0

  Object.entries(estrutura).forEach(([secao, itens]) => {
    itens.forEach((item) => {
      const chave = `${secao}-${item}`
      const nota = dados[chave]
      total++
      if (nota === 1) soma += 0
      else if (nota === 2) soma += 50
      else if (nota === 3) soma += 100
    })
  })

  const notaFinal = total ? Math.round(soma / total) : 0

  let status = "REPROVADO"
  let statusColor = "#dc2626"
  if (notaFinal >= 90) { status = "APROVADO"; statusColor = "#16a34a" }
  else if (notaFinal >= 70) { status = "ATENÇÃO"; statusColor = "#f59e0b" }

  async function gerarPDF() {
    const html = `
      <html>
        <body style="font-family: Arial; padding: 24px; color: #111;">

          <h1 style="color:#111; margin-bottom: 4px;">Relatório de Auditoria</h1>
          <hr style="border: 1px solid #e5e7eb; margin-bottom: 16px;" />

          ${loja ? `<p style="margin: 4px 0;"><strong>Loja:</strong> ${loja}</p>` : ""}
          ${data ? `<p style="margin: 4px 0;"><strong>Data:</strong> ${data}</p>` : ""}
          ${auditor ? `<p style="margin: 4px 0;"><strong>Auditor:</strong> ${auditor}</p>` : ""}
          ${responsavel ? `<p style="margin: 4px 0;"><strong>Responsável:</strong> ${responsavel}</p>` : ""}

          <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border-left: 5px solid ${statusColor}; border-radius: 4px;">
            <h2 style="margin: 0 0 4px 0;">Nota Final: ${notaFinal}/100</h2>
            <p style="margin: 0; font-size: 18px; color: ${statusColor}; font-weight: bold;">${status}</p>
          </div>

          <hr style="border: 1px solid #e5e7eb;" />
          <h3>Itens Avaliados</h3>

          ${Object.entries(estrutura)
            .map(([secao, itens]) => `
              <h3 style="margin-top: 18px; color: #374151;">${secao}</h3>
              ${itens.map((item) => {
                const nota = dados[`${secao}-${item}`]
                let icon = "○"
                if (nota === 1) icon = "❌"
                if (nota === 2) icon = "⚠️"
                if (nota === 3) icon = "✅"
                return `<p style="margin: 4px 0;">${icon} ${item}</p>`
              }).join("")}
            `).join("")}

        </body>
      </html>
    `

    const { uri } = await Print.printToFileAsync({ html })
    await Sharing.shareAsync(uri)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>

      {/* Card de nota */}
      <View style={{
        margin: 20,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 5,
        borderLeftColor: statusColor,
      }}>
        <Text style={{ fontSize: 16 }}>Nota final</Text>
        <Text style={{ fontSize: 34, fontWeight: "bold" }}>{notaFinal}/100</Text>
        <Text style={{ fontSize: 18, color: statusColor, fontWeight: "bold" }}>{status}</Text>
      </View>

      {/* Informações da auditoria */}
      {(loja || auditor || responsavel || data) && (
        <View style={{
          marginHorizontal: 20,
          marginBottom: 12,
          backgroundColor: "#fff",
          padding: 14,
          borderRadius: 12,
          gap: 4,
        }}>
          {!!loja && <Text style={{ fontSize: 15, color: "#374151" }}>🏪 {loja}</Text>}
          {!!data && <Text style={{ fontSize: 14, color: "#6b7280" }}>📅 {data}</Text>}
          {!!auditor && (
            <Text style={{ fontSize: 15, color: "#374151" }}>👤 Auditor: {auditor}</Text>
          )}
          {!!responsavel && (
            <Text style={{ fontSize: 15, color: "#374151" }}>🙋 Responsável: {responsavel}</Text>
          )}
        </View>
      )}

      {/* Exportar PDF */}
      <TouchableOpacity
        onPress={gerarPDF}
        style={{
          marginHorizontal: 20,
          marginBottom: 15,
          backgroundColor: "#111827",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
          📄 Exportar PDF profissional
        </Text>
      </TouchableOpacity>

      {/* Itens */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {Object.entries(estrutura).map(([secao, itens]) => (
          <View key={secao} style={{ marginBottom: 25 }}>
            <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 10 }}>{secao}</Text>

            {itens.map((item) => {
              const chave = `${secao}-${item}`
              const nota = dados[chave]

              let icon = "○"
              let bg = "#f3f4f6"
              let color = "#9ca3af"

              if (nota === 1) { icon = "❌"; bg = "#fee2e2"; color = "#dc2626" }
              else if (nota === 2) { icon = "⚠️"; bg = "#fef3c7"; color = "#b45309" }
              else if (nota === 3) { icon = "✅"; bg = "#dcfce7"; color = "#16a34a" }

              return (
                <View
                  key={item}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: bg,
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 10, color }}>{icon}</Text>
                  <Text style={{ fontSize: 16, color }}>{item}</Text>
                </View>
              )
            })}
          </View>
        ))}
      </ScrollView>

    </SafeAreaView>
  )
}
