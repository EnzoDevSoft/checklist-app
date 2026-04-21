import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  TextInput,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { useFocusEffect } from "expo-router"
import Toast from "react-native-toast-message"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/src/services/firebase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { estruturaPadrao, getEstrutura, salvarEstrutura } from "@/src/services/utils/estrutura"

export default function Checklist() {
  const router = useRouter()

  const [estrutura, setEstrutura] = useState<Record<string, string[]>>(estruturaPadrao)
  const [dados, setDados] = useState<Record<string, number>>({})
  const [menuAberto, setMenuAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  const [loja, setLoja] = useState("")
  const [data, setData] = useState("")
  const [auditor, setAuditor] = useState("")
  const [responsavel, setResponsavel] = useState("")
  const [preenchedor, setPreenchedor] = useState("")

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

  async function salvarAuditoria() {
    try {
      await addDoc(collection(db, "auditorias"), {
        loja,
        data,
        auditor,
        responsavel,
        preenchedor,
        timestamp: new Date().toISOString(),
        dados: { ...dados },
      })

      setLoja("")
      setData("")
      setAuditor("")
      setResponsavel("")
      setPreenchedor("")
      setDados({})

      Toast.show({
        type: "success",
        text1: "✔ SALVO NA NUVEM",
        text2: "Auditoria enviada com sucesso",
      })
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro Firebase",
        text2: error?.message || "Falha ao salvar",
      })
    }
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

  // ─── Animação botão salvar ───────────────────────────────────────────────────

  const itensMarcados = Object.values(dados).filter((v) => v > 0).length
  const somaNotas = Object.values(dados).reduce((a, b) => a + b, 0)
  const media = itensMarcados ? (somaNotas / itensMarcados).toFixed(2) : "0"

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

        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
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
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>
              Salvar tópicos
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Campos de identificação — ocultos no modo edição */}
      {!modoEdicao && (
        <View style={{ paddingHorizontal: 20, gap: 8, marginBottom: 4 }}>
          <TextInput
            placeholder="Nome da loja"
            placeholderTextColor="#9ca3af"
            value={loja}
            onChangeText={setLoja}
            style={{ backgroundColor: "#fff", padding: 12, borderRadius: 10, color: "#000", fontSize: 15 }}
          />
          <TextInput
            placeholder="Data"
            placeholderTextColor="#9ca3af"
            value={data}
            onChangeText={setData}
            style={{ backgroundColor: "#fff", padding: 12, borderRadius: 10, color: "#000", fontSize: 15 }}
          />
          <TextInput
            placeholder="Auditor (quem fez a auditoria)"
            placeholderTextColor="#9ca3af"
            value={auditor}
            onChangeText={setAuditor}
            style={{ backgroundColor: "#fff", padding: 12, borderRadius: 10, color: "#000", fontSize: 15 }}
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

      {/* Média */}
      {!modoEdicao && (
        <Text style={{ paddingHorizontal: 20, fontSize: 16, color: "#6b7280", marginVertical: 8 }}>
          Média geral: <Text style={{ fontWeight: "600", color: "#111827" }}>{media}/3</Text>
        </Text>
      )}

      {/* Lista de itens */}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        {Object.entries(estrutura).map(([secao, itens]) => (
          <View key={secao} style={{ marginBottom: 28 }}>

            {/* Cabeçalho da seção */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
              gap: 8,
            }}>
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
                  <Text style={{ color: "#0369a1", fontSize: 13, fontWeight: "600" }}>
                    + Item
                  </Text>
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
                  {/* Nota / indicador */}
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
                      {/* Indicador de edição */}
                      <View style={{
                        width: 4,
                        alignSelf: "stretch",
                        backgroundColor: "#f59e0b",
                      }} />

                      <TextInput
                        value={item}
                        onChangeText={(text) => editarItem(secao, index, text)}
                        style={{
                          flex: 1,
                          fontSize: 15,
                          color: "#111827",
                          padding: 14,
                        }}
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

        {/* Botão restaurar padrão (só no modo edição) */}
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
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Salvar Auditoria</Text>
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
