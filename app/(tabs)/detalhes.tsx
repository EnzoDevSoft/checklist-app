import * as Print from "expo-print"
import { useLocalSearchParams } from "expo-router"
import * as Sharing from "expo-sharing"
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native"

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
  const observacoes = (params.observacoes as string) || ""

  // ── Nota geral ────────────────────────────────────────────────────────────
  let soma = 0
  let total = 0
  Object.entries(estrutura).forEach(([secao, itens]) => {
    itens.forEach((item) => {
      const nota = dados[`${secao}-${item}`]
      total++
      if (nota === 2) soma += 50
      else if (nota === 3) soma += 100
    })
  })
  const notaFinal = total ? Math.round(soma / total) : 0

  let status = "REPROVADO"
  let statusColor = "#dc2626"
  if (notaFinal >= 90) { status = "APROVADO"; statusColor = "#16a34a" }
  else if (notaFinal >= 70) { status = "ATENÇÃO"; statusColor = "#f59e0b" }

  // ── Nota por seção ────────────────────────────────────────────────────────
  const notasPorSecao: Record<string, number> = {}
  Object.entries(estrutura).forEach(([secao, itens]) => {
    let s = 0
    itens.forEach((item) => {
      const nota = dados[`${secao}-${item}`]
      if (nota === 2) s += 50
      else if (nota === 3) s += 100
    })
    notasPorSecao[secao] = Math.round(s / itens.length)
  })

  // ── Itens críticos (nota 1 = ❌) ─────────────────────────────────────────
  const itensCriticos: { secao: string; item: string }[] = []
  Object.entries(estrutura).forEach(([secao, itens]) => {
    itens.forEach((item) => {
      if (dados[`${secao}-${item}`] === 1) itensCriticos.push({ secao, item })
    })
  })

  // ── PDF ───────────────────────────────────────────────────────────────────
  async function gerarPDF() {
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; padding: 32px; color: #111; font-size: 13px; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            hr { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
            .meta p { margin: 3px 0; }
            .score-box { margin: 18px 0; padding: 14px 18px; background: #f9fafb; border-left: 5px solid ${statusColor}; border-radius: 4px; }
            .score-box h2 { font-size: 20px; margin-bottom: 4px; }
            .score-box .status { font-size: 16px; color: ${statusColor}; font-weight: bold; }

            /* Críticos */
            .criticos { background: #fff1f2; border: 1px solid #fecaca; border-radius: 6px; padding: 14px; margin-bottom: 18px; page-break-inside: avoid; }
            .criticos h3 { color: #dc2626; font-size: 14px; margin-bottom: 8px; }
            .criticos p { font-size: 13px; color: #7f1d1d; margin: 3px 0; }

            /* Resumo por seção */
            .secoes { margin-bottom: 18px; page-break-inside: avoid; }
            .secoes h3 { font-size: 14px; margin-bottom: 10px; color: #374151; }
            .secao-row { display: flex; align-items: center; margin-bottom: 6px; }
            .secao-label { width: 180px; font-size: 12px; color: #374151; }
            .bar-bg { flex: 1; background: #e5e7eb; border-radius: 4px; height: 10px; }
            .bar-fill { height: 10px; border-radius: 4px; }
            .secao-pct { width: 40px; text-align: right; font-size: 12px; font-weight: bold; }

            /* Itens */
            .secao { page-break-inside: avoid; margin-top: 22px; }
            .secao h3 { font-size: 14px; color: #374151; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            .item { margin: 5px 0; font-size: 13px; }

            /* Obs */
            .obs-box { page-break-inside: avoid; margin-top: 28px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; }
            .obs-box h3 { font-size: 14px; margin-bottom: 8px; color: #374151; }
            .obs-box p { font-size: 13px; white-space: pre-wrap; line-height: 1.6; }
            .obs-vazia { color: #9ca3af; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>Relatório de Auditoria</h1>
          <hr />
          <div class="meta">
            ${loja        ? `<p><strong>Loja:</strong> ${loja}</p>`               : ""}
            ${data        ? `<p><strong>Data:</strong> ${data}</p>`               : ""}
            ${auditor     ? `<p><strong>Auditor:</strong> ${auditor}</p>`         : ""}
            ${responsavel ? `<p><strong>Responsável:</strong> ${responsavel}</p>` : ""}
          </div>

          <div class="score-box">
            <h2>Nota Final: ${notaFinal}/100</h2>
            <p class="status">${status}</p>
          </div>

          ${itensCriticos.length > 0 ? `
          <div class="criticos">
            <h3>⚠️ Itens Críticos (${itensCriticos.length})</h3>
            ${itensCriticos.map(({ secao, item }) => `<p>❌ <strong>${secao}:</strong> ${item}</p>`).join("")}
          </div>` : ""}

          <div class="secoes">
            <h3>Desempenho por Área</h3>
            ${Object.entries(notasPorSecao).map(([secao, nota]) => {
              const cor = nota >= 90 ? "#16a34a" : nota >= 70 ? "#f59e0b" : "#dc2626"
              return `
                <div class="secao-row">
                  <span class="secao-label">${secao}</span>
                  <div class="bar-bg">
                    <div class="bar-fill" style="width:${nota}%; background:${cor};"></div>
                  </div>
                  <span class="secao-pct">${nota}%</span>
                </div>`
            }).join("")}
          </div>

          <hr />
          <strong>Itens Avaliados</strong>
          ${Object.entries(estrutura).map(([secao, itens]) => `
            <div class="secao">
              <h3>${secao}</h3>
              ${itens.map((item) => {
                const nota = dados[`${secao}-${item}`]
                let icon = "○"
                if (nota === 1) icon = "❌"
                if (nota === 2) icon = "⚠️"
                if (nota === 3) icon = "✅"
                return `<p class="item">${icon} ${item}</p>`
              }).join("")}
            </div>
          `).join("")}

          <div class="obs-box">
            <h3>📝 Observações / Comentários</h3>
            ${observacoes.trim()
              ? `<p>${observacoes.trim()}</p>`
              : `<p class="obs-vazia">Nenhuma observação registrada.</p>`}
          </div>
        </body>
      </html>
    `

    try {
      const result = await Print.printToFileAsync({ html, base64: false })
      if (result?.uri) await Sharing.shareAsync(result.uri)
    } catch {
      // cancelado pelo usuário
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>

      {/* Card de nota geral */}
      <View style={{
        margin: 20,
        marginBottom: 12,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 5,
        borderLeftColor: statusColor,
      }}>
        <Text style={{ fontSize: 14, color: "#6b7280" }}>Nota final</Text>
        <Text style={{ fontSize: 38, fontWeight: "bold", color: "#111827" }}>{notaFinal}/100</Text>
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
          {!!loja        && <Text style={{ fontSize: 15, color: "#374151" }}>🏪 {loja}</Text>}
          {!!data        && <Text style={{ fontSize: 14, color: "#6b7280" }}>📅 {data}</Text>}
          {!!auditor     && <Text style={{ fontSize: 15, color: "#374151" }}>👤 Auditor: {auditor}</Text>}
          {!!responsavel && <Text style={{ fontSize: 15, color: "#374151" }}>🙋 Responsável: {responsavel}</Text>}
        </View>
      )}

      {/* Exportar PDF */}
      <TouchableOpacity
        onPress={gerarPDF}
        style={{
          marginHorizontal: 20,
          marginBottom: 12,
          backgroundColor: "#111827",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "bold" }}>
          📄 Exportar PDF profissional
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* ── Itens Críticos ─────────────────────────────────────────────── */}
        {itensCriticos.length > 0 && (
          <View style={{
            backgroundColor: "#fff1f2",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#fecaca",
            padding: 16,
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#dc2626", marginBottom: 10 }}>
              🚨 Itens Críticos — Ação Imediata ({itensCriticos.length})
            </Text>
            {itensCriticos.map(({ secao, item }, i) => (
              <View key={i} style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 6,
                gap: 8,
              }}>
                <Text style={{ color: "#dc2626", fontSize: 15 }}>❌</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: "#991b1b", fontWeight: "600" }}>{secao}</Text>
                  <Text style={{ fontSize: 14, color: "#7f1d1d" }}>{item}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Resumo por seção ───────────────────────────────────────────── */}
        <View style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 14 }}>
            📊 Desempenho por Área
          </Text>
          {Object.entries(notasPorSecao).map(([secao, nota]) => {
            const cor = nota >= 90 ? "#16a34a" : nota >= 70 ? "#f59e0b" : "#dc2626"
            return (
              <View key={secao} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, color: "#374151", fontWeight: "500", flex: 1 }}>{secao}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: cor }}>{nota}%</Text>
                </View>
                <View style={{ height: 8, backgroundColor: "#e5e7eb", borderRadius: 4 }}>
                  <View style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: cor,
                    width: `${nota}%`,
                  }} />
                </View>
              </View>
            )
          })}
        </View>

        {/* ── Itens por seção ────────────────────────────────────────────── */}
        {Object.entries(estrutura).map(([secao, itens]) => (
          <View key={secao} style={{ marginBottom: 25 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10, color: "#111827" }}>{secao}</Text>

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
                <View key={item} style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: bg,
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 18, marginRight: 10, color }}>{icon}</Text>
                  <Text style={{ fontSize: 15, color, flex: 1 }}>{item}</Text>
                </View>
              )
            })}
          </View>
        ))}

        {/* ── Observações ────────────────────────────────────────────────── */}
        <View style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 16,
          marginTop: 4,
        }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 8 }}>
            📝 Observações / Comentários
          </Text>
          {observacoes.trim() ? (
            <Text style={{ fontSize: 15, color: "#374151", lineHeight: 22 }}>{observacoes.trim()}</Text>
          ) : (
            <Text style={{ fontSize: 14, color: "#9ca3af", fontStyle: "italic" }}>
              Nenhuma observação registrada.
            </Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}