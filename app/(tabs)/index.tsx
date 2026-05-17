import { db } from "@/src/services/firebase"
import { estruturaPadrao, getEstrutura, salvarEstrutura } from "@/src/services/utils/estrutura"
import { useFocusEffect, useRouter } from "expo-router"
import { addDoc, collection } from "firebase/firestore"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import Toast from "react-native-toast-message"

function dataHoje() {
  const hoje = new Date()
  const dia = String(hoje.getDate()).padStart(2, "0")
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const ano = String(hoje.getFullYear()).slice(-2)
  return `${dia}/${mes}/${ano}`
}

export default function Checklist() {
  const router = useRouter()

  const [estrutura, setEstrutura] = useState<Record<string, string[]>>(estruturaPadrao)
  const [dados, setDados] = useState<Record<string, number>>({})
  const [menuAberto, setMenuAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  const [loja, setLoja] = useState("")
  const [data, setData] = useState(dataHoje())
  const [auditor, setAuditor] = useState("")
  const [responsavel, setResponsavel] = useState("")
  const [preenchedor, setPreenchedor] = useState("")
  const [observacoes, setObservacoes] = useState("")

  const menuAnim = useRef(new Animated.Value(-260)).current
  const fadeBotao = useRef(new Animated.Value(0)).current
  const scaleBotao = useRef(new Animated.Value(0.95)).current
  const prevItens = useRef(0)

  useFocusEffect(
    useCallback(() => {
      getEstrutura().then(setEstrutura)
    }, [])
  )

  // ─── Checklist ──────────────────────────────────────────────────────────────

  function toggleItem(secao: string, item: string) {
    const chave = `${secao}-${item}`
    setDados((prev) => {
      const atual = prev[chave] ?? 0
      return { ...prev, [chave]: atual >= 3 ? 0 : atual + 1 }
    })
  }

  function corNota(nota: number) {
    if (nota === 0) return "#d1d5db"
    if (nota === 1) return "#ef4444"
    if (nota === 2) return "#f59e0b"
    return "#22c55e"
  }

  function limparTudo() {
    Alert.alert(
      "Limpar checklist",
      "Apagar todos os dados preenchidos e começar do zero?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: () => {
            setLoja("")
            setData(dataHoje())
            setAuditor("")
            setResponsavel("")
            setPreenchedor("")
            setObservacoes("")
            setDados({})
          },
        },
      ]
    )
  }

  async function salvarAuditoria() {
    // ── Validação obrigatória ──────────────────────────────────────────────
    const camposFaltando: string[] = []
    if (!loja.trim()) camposFaltando.push("Nome da loja")
    if (!data.trim()) camposFaltando.push("Data")
    if (!auditor.trim()) camposFaltando.push("Auditor")

    if (camposFaltando.length > 0) {
      Alert.alert(
        "Campos obrigatórios",
        `Preencha antes de salvar:\n\n• ${camposFaltando.join("\n• ")}`,
        [{ text: "OK" }]
      )
      return
    }

    // ── Confirmação ────────────────────────────────────────────────────────
    const totalItens = Object.values(estrutura).reduce((a, b) => a + b.length, 0)
    const avaliados = Object.values(dados).filter((v) => v > 0).length
    const criticos = Object.values(dados).filter((v) => v === 1).length

    Alert.alert(
      "Confirmar Auditoria",
      `Loja: ${loja}\nData: ${data}\nAuditor: ${auditor}\n\n${avaliados}/${totalItens} itens avaliados${criticos > 0 ? `\n⚠️ ${criticos} item(ns) crítico(s)` : ""}\n\nDeseja salvar e gerar o relatório?`,
      [
        { text: "Revisar", style: "cancel" },
        {
          text: "Salvar",
          onPress: async () => {
            try {
              await addDoc(collection(db, "auditorias"), {
                loja,
                data,
                auditor,
                responsavel,
                preenchedor,
                observacoes,
                timestamp: new Date().toISOString(),
                dados: { ...dados },
              })

              Toast.show({
                type: "success",
                text1: "✔ SALVO NA NUVEM",
                text2: "Auditoria enviada com sucesso",
              })

              router.push({
                pathname: "/detalhes",
                params: {
                  dados: JSON.stringify(dados),
                  loja,
                  data,
                  auditor,
                  responsavel,
                  observacoes,
                },
              })

              setLoja("")
              setData(dataHoje())
              setAuditor("")
              setResponsavel("")
              setPreenchedor("")
              setObservacoes("")
              setDados({})

            } catch (error: any) {
  console.log("ERRO FIREBASE:", error)
  Alert.alert(
    "Erro ao salvar",
    error?.message || "Falha ao conectar com o Firebase. Verifique sua conexão e as regras do Firestore.",
    [{ text: "OK" }]
  )
}
          },
        },
      ]
    )
  }

  // ─── Edição de tópicos ───────────────────────────────────────────────────────

  function editarItem(secao: string, index: number, texto: string) {
    setEstrutura((prev) => {
      const copia = { ...prev, [secao]: [...prev[secao]] }
      copia[secao][index] = texto
      return copia
    })
  }

  function removerItem(secao: string, index: number) {
    Alert.alert("Remover item", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () =>
          setEstrutura((prev) => ({
            ...prev,
            [secao]: prev[secao].filter((_, i) => i !== index),
          })),
      },
    ])
  }

  function adicionarItem(secao: string) {
    setEstrutura((prev) => ({
      ...prev,
      [secao]: [...prev[secao], "Novo item"],
    }))
  }

  async function confirmarEdicao() {
    await salvarEstrutura(estrutura)
    setModoEdicao(false)
    Toast.show({ type: "success", text1: "Tópicos salvos com sucesso" })
  }

  function cancelarEdicao() {
    getEstrutura().then((e) => {
      setEstrutura(e)
      setModoEdicao(false)
    })
  }

  // ─── Métricas em tempo real ──────────────────────────────────────────────────

  const totalItens = Object.values(estrutura).reduce((a, b) => a + b.length, 0)
  const itensMarcados = Object.values(dados).filter((v) => v > 0).length
  const itensCriticos = Object.values(dados).filter((v) => v === 1).length
  const itensAtencao = Object.values(dados).filter((v) => v === 2).length
  const progresso = totalItens ? Math.round((itensMarcados / totalItens) * 100) : 0

  useEffect(() => {
    const anterior = prevItens.current
    if (anterior === 0 && itensMarcados > 0) {
      fadeBotao.setValue(0)
      scaleBotao.setValue(0.98)
      Animated.parallel([
        Animated.timing(fadeBotao, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(scaleBotao, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start()
    }
    if (itensMarcados === 0) {
      fadeBotao.setValue(0)
      scaleBotao.setValue(0.98)
    }
    prevItens.current = itensMarcados
  }, [itensMarcados])

  // ─── Menu ────────────────────────────────────────────────────────────────────

  function abrirMenu() {
    setMenuAberto(true)
    Animated.timing(menuAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start()
  }

  function fecharMenu(callback?: () => void) {
    Animated.timing(menuAnim, { toValue: -260, duration: 200, useNativeDriver: true }).start(() => {
      setMenuAberto(false)
      callback?.()
    })
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>

      {/* Header */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        alignItems: "center",
      }}>
        <Text style={{ fontSize: 28, fontWeight: "bold" }}>Checklist 📝</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>

          {/* Botão limpar */}
          {!modoEdicao && itensMarcados > 0 && (
            <TouchableOpacity
              onPress={limparTudo}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#fca5a5",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#ef4444" }}>🗑 Limpar</Text>
            </TouchableOpacity>
          )}

          {/* Botão modo edição */}
          <TouchableOpacity
            onPress={() => modoEdicao ? cancelarEdicao() : setModoEdicao(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: modoEdicao ? "#fef3c7" : "#f3f4f6",
              borderWidth: 1,
              borderColor: modoEdicao ? "#f59e0b" : "#d1d5db",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 14 }}>{modoEdicao ? "✕" : "✏️"}</Text>
            <Text style={{
              fontSize: 13,
              fontWeight: "600",
              color: modoEdicao ? "#92400e" : "#374151",
            }}>
              {modoEdicao ? "Cancelar" : "Editar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={abrirMenu}>
            <Text style={{ fontSize: 26 }}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner modo edição */}
      {modoEdicao && (
        <View style={{
          marginHorizontal: 20,
          marginBottom: 8,
          backgroundColor: "#fffbeb",
          borderWidth: 1,
          borderColor: "#fcd34d",
          borderRadius: 10,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Text style={{ color: "#92400e", fontSize: 13, fontWeight: "500", flex: 1 }}>
            ✏️ Modo edição ativo — edite os itens abaixo
          </Text>
          <TouchableOpacity
            onPress={confirmarEdicao}
            style={{
              backgroundColor: "#22c55e",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>Salvar tópicos</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Campos de identificação */}
      {!modoEdicao && (
        <View style={{ paddingHorizontal: 20, gap: 8, marginBottom: 4 }}>
          <TextInput
            placeholder="Nome da loja *"
            placeholderTextColor="#9ca3af"
            value={loja}
            onChangeText={setLoja}
            style={{
              backgroundColor: "#fff",
              padding: 12,
              borderRadius: 10,
              color: "#000",
              fontSize: 15,
              borderWidth: !loja.trim() ? 1.5 : 0,
              borderColor: "#fca5a5",
            }}
          />
          <TextInput
            placeholder="Data *"
            placeholderTextColor="#9ca3af"
            value={data}
            onChangeText={setData}
            style={{
              backgroundColor: "#fff",
              padding: 12,
              borderRadius: 10,
              color: "#000",
              fontSize: 15,
              borderWidth: !data.trim() ? 1.5 : 0,
              borderColor: "#fca5a5",
            }}
          />
          <TextInput
            placeholder="Auditor (quem fez a auditoria) *"
            placeholderTextColor="#9ca3af"
            value={auditor}
            onChangeText={setAuditor}
            style={{
              backgroundColor: "#fff",
              padding: 12,
              borderRadius: 10,
              color: "#000",
              fontSize: 15,
              borderWidth: !auditor.trim() ? 1.5 : 0,
              borderColor: "#fca5a5",
            }}
          />
          <TextInput
            placeholder="Responsável (quem respondeu)"
            placeholderTextColor="#9ca3af"
            value={responsavel}
            onChangeText={setResponsavel}
            style={{ backgroundColor: "#fff", padding: 12, borderRadius: 10, color: "#000", fontSize: 15 }}
          />
          <TextInput
            placeholder="Preenchedor (quem digitou)"
            placeholderTextColor="#9ca3af"
            value={preenchedor}
            onChangeText={setPreenchedor}
            style={{ backgroundColor: "#fff", padding: 12, borderRadius: 10, color: "#000", fontSize: 15 }}
          />
        </View>
      )}

      {/* ── Barra de progresso + indicadores ── */}
      {!modoEdicao && (
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>

          {/* Linha de texto */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>
              Progresso:{" "}
              <Text style={{ fontWeight: "700", color: "#111827" }}>
                {itensMarcados}/{totalItens}
              </Text>
              {" "}itens
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {itensCriticos > 0 && (
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#dc2626" }}>
                  ❌ {itensCriticos} crítico{itensCriticos > 1 ? "s" : ""}
                </Text>
              )}
              {itensAtencao > 0 && (
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#b45309" }}>
                  ⚠️ {itensAtencao} atenção{itensAtencao > 1 ? "ões" : ""}
                </Text>
              )}
            </View>
          </View>

          {/* Barra de progresso */}
          <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 4 }}>
            <View style={{
              height: 6,
              borderRadius: 4,
              backgroundColor: progresso === 100 ? "#16a34a" : "#3b82f6",
              width: `${progresso}%`,
            }} />
          </View>

        </View>
      )}

      {/* Lista de itens */}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        {Object.entries(estrutura).map(([secao, itens]) => (
          <View key={secao} style={{ marginBottom: 28 }}>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", flex: 1 }}>
                {secao}
              </Text>
              {modoEdicao && (
                <TouchableOpacity
                  onPress={() => adicionarItem(secao)}
                  style={{
                    backgroundColor: "#e0f2fe",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "#0369a1", fontSize: 13, fontWeight: "600" }}>+ Item</Text>
                </TouchableOpacity>
              )}
            </View>

            {itens.map((item, index) => {
              const chave = `${secao}-${item}`
              const nota = dados[chave] ?? 0

              return (
                <View
                  key={`${secao}-${index}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    marginBottom: 8,
                    borderRadius: 12,
                    overflow: "hidden",
                    borderWidth: modoEdicao ? 1.5 : 0,
                    borderColor: modoEdicao ? "#fcd34d" : "transparent",
                  }}
                >
                  {!modoEdicao ? (
                    <TouchableOpacity
                      onPress={() => toggleItem(secao, item)}
                      style={{ flexDirection: "row", alignItems: "center", flex: 1, padding: 14 }}
                    >
                      <View style={{
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        backgroundColor: corNota(nota),
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}>
                        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>{nota}</Text>
                      </View>
                      <Text style={{ fontSize: 16, flexShrink: 1, color: "#111827" }}>{item}</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <View style={{ width: 4, alignSelf: "stretch", backgroundColor: "#f59e0b" }} />
                      <TextInput
                        value={item}
                        onChangeText={(text) => editarItem(secao, index, text)}
                        style={{ flex: 1, fontSize: 15, color: "#111827", padding: 14 }}
                        multiline
                      />
                      <TouchableOpacity
                        onPress={() => removerItem(secao, index)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 14,
                          alignSelf: "stretch",
                          justifyContent: "center",
                          backgroundColor: "#fff5f5",
                        }}
                      >
                        <Text style={{ fontSize: 16, color: "#ef4444" }}>✕</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )
            })}
          </View>
        ))}

        {/* Botão restaurar padrão */}
        {modoEdicao && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Restaurar padrão", "Apagar todas as alterações e voltar ao padrão?", [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Restaurar",
                  style: "destructive",
                  onPress: async () => {
                    await salvarEstrutura(estruturaPadrao)
                    setEstrutura(estruturaPadrao)
                    setModoEdicao(false)
                  },
                },
              ])
            }
            style={{
              marginTop: 8,
              padding: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#fca5a5",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ef4444", fontWeight: "600" }}>Restaurar tópicos padrão</Text>
          </TouchableOpacity>
        )}

        {/* Campo de Observações */}
        {!modoEdicao && (
          <View style={{
            marginTop: 8,
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 10 }}>
              Observações
            </Text>
            <TextInput
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Registre aqui observações relevantes sobre a auditoria, pontos de atenção ou elogios..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 12,
                fontSize: 15,
                color: "#111827",
                minHeight: 120,
                lineHeight: 22,
              }}
            />
          </View>
        )}

      </ScrollView>

      {/* Botão salvar auditoria */}
      {itensMarcados > 0 && !modoEdicao && (
        <Animated.View style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          padding: 16,
          backgroundColor: "#f3f4f6",
          borderTopWidth: 1,
          borderColor: "#e5e7eb",
          opacity: fadeBotao,
          transform: [{ scale: scaleBotao }],
        }}>
          <TouchableOpacity
            onPress={salvarAuditoria}
            style={{ backgroundColor: "#22c55e", padding: 18, borderRadius: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
              Salvar Auditoria · {progresso}%
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Overlay menu */}
      {menuAberto && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => fecharMenu()}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}

      {/* Menu lateral */}
      {menuAberto && (
        <Animated.View style={{
          position: "absolute",
          top: 0, left: 0, bottom: 0,
          width: 260,
          backgroundColor: "#fff",
          padding: 24,
          transform: [{ translateX: menuAnim }],
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>Menu</Text>

          {[
            { label: "📈 Dashboard", route: "/dashboard" },
            { label: "📊 Histórico", route: "/historico" },
          ].map(({ label, route }) => (
            <TouchableOpacity
              key={route}
              onPress={() => fecharMenu(() => router.push(route as any))}
              style={{
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#f3f4f6",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

    </SafeAreaView>
  )
}