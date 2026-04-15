import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  TextInput,
} from "react-native"
import { useRouter } from "expo-router"
import Toast from "react-native-toast-message"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/src/services/firebase"

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

export default function Checklist() {
  const router = useRouter()

  const [dados, setDados] = useState<Record<string, number>>({})
  const [menuAberto, setMenuAberto] = useState(false)

  const [loja, setLoja] = useState("")
  const [data, setData] = useState("")

  const menuAnim = useRef(new Animated.Value(-260)).current
  const overlayAnim = useRef(new Animated.Value(0)).current

  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current

  const prevMarcados = useRef(0)

  // 🔥 ADICIONADO: animação botão salvar
  const fadeBotao = useRef(new Animated.Value(0)).current
  const scaleBotao = useRef(new Animated.Value(0.95)).current
  const prevItens = useRef(0)

  function toggleItem(secao: string, item: string) {
    const chave = `${secao}-${item}`

    setDados((prev) => {
      const atual = prev[chave] ?? 0
      const proximo = atual >= 3 ? 0 : atual + 1

      return {
        ...prev,
        [chave]: proximo,
      }
    })
  }

  function corNota(nota: number) {
    if (nota === 0) return "#ef4444"
    if (nota === 1) return "#f59e0b"
    if (nota === 2) return "#22c55e"
    return "#3b82f6"
  }

  async function salvarDados() {
    try {
      const auditoria = {
        loja,
        data,
        timestamp: new Date().toISOString(),
        dados: { ...dados },
      }

      await addDoc(collection(db, "auditorias"), auditoria)

      setLoja("")
setTimeout(() => setLoja(""), 0)

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

  const itensMarcados = Object.values(dados).filter((v) => v > 0).length

  const somaNotas = Object.values(dados).reduce((a, b) => a + b, 0)
  const media = itensMarcados ? (somaNotas / itensMarcados).toFixed(2) : "0"

  useEffect(() => {
    const anterior = prevMarcados.current
    const atual = itensMarcados

    if (anterior !== atual) {
      fadeAnim.setValue(0)
      translateY.setValue(20)

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }

    if (atual === 0) {
      fadeAnim.setValue(0)
      translateY.setValue(20)
    }

    prevMarcados.current = atual
  }, [itensMarcados])

  // 🔥 ANIMAÇÃO DO BOTÃO (SÓ FADE, SEM MEXER NO DESIGN)
  useEffect(() => {
    const anterior = prevItens.current
    const atual = itensMarcados

    if (anterior === 0 && atual > 0) {
      fadeBotao.setValue(0)
      scaleBotao.setValue(0.98)

      Animated.parallel([
        Animated.timing(fadeBotao, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleBotao, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()
    }

    if (atual === 0) {
      fadeBotao.setValue(0)
      scaleBotao.setValue(0.98)
    }

    prevItens.current = atual
  }, [itensMarcados])

  function abrirMenu() {
    setMenuAberto(true)

    Animated.parallel([
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }

  function fecharMenu(callback?: () => void) {
    Animated.parallel([
      Animated.timing(menuAnim, {
        toValue: -260,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuAberto(false)
      callback && callback()
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>

      {/* HEADER */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 20,
        alignItems: "center",
      }}>
        <Text style={{ fontSize: 30, fontWeight: "bold" }}>
          Checklist 📝
        </Text>

        <TouchableOpacity onPress={abrirMenu}>
          <Text style={{ fontSize: 28 }}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* INPUTS */}
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        <TextInput
          placeholder="Nome da loja:"
          placeholderTextColor="#666"
          value={loja}
          onChangeText={setLoja}
          style={{
            backgroundColor: "#fff",
            padding: 12,
            borderRadius: 10,
            color: "#000",
          }}
        />

        <TextInput
          placeholder="Data:"
          placeholderTextColor="#666"
          value={data}
          onChangeText={setData}
          style={{
            backgroundColor: "#fff",
            padding: 12,
            borderRadius: 10,
            color: "#000",
          }}
        />
      </View>

      {/* MÉDIA */}
      <Text style={{
        paddingHorizontal: 20,
        fontSize: 18,
        color: "#6b7280",
        marginVertical: 10,
      }}>
        Média geral: {media}/3
      </Text>

      {/* LISTA */}
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        {Object.entries(estrutura).map(([secao, itens]) => (
          <View key={secao} style={{ marginBottom: 25 }}>
            <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 12 }}>
              {secao}
            </Text>

            {itens.map((item) => {
              const chave = `${secao}-${item}`
              const nota = dados[chave] ?? 0

              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleItem(secao, item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    backgroundColor: "#fff",
                    marginBottom: 10,
                    borderRadius: 12,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: corNota(nota),
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      {nota}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 18, flexShrink: 1 }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </ScrollView>

      {/* BOTÃO SALVAR (SÓ ANIMAÇÃO ADICIONADA) */}
      {itensMarcados > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: "#f3f4f6",
            borderTopWidth: 1,
            borderColor: "#e5e7eb",

            opacity: fadeBotao,
            transform: [{ scale: scaleBotao }],
          }}
        >
          <TouchableOpacity
            onPress={salvarDados}
            style={{
              backgroundColor: "#22c55e",
              padding: 18,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "bold",
            }}>
              Salvar Auditoria
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
{/* OVERLAY - FECHAR CLICANDO FORA */}
{menuAberto && (
  <TouchableOpacity
    activeOpacity={1}
    onPress={() => fecharMenu()}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
    }}
  />
)}
      {/* MENU */}
{menuAberto && (
  <Animated.View style={{
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    backgroundColor: "#fff",
    padding: 20,
    transform: [{ translateX: menuAnim }],
  }}>
    <Text style={{ fontSize: 22, fontWeight: "bold" }}>
      Menu
    </Text>

    <TouchableOpacity
      onPress={() => fecharMenu(() => router.push("/dashboard"))}
      style={{ paddingVertical: 18 }}
    >
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        📈 Dashboard
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => fecharMenu(() => router.push("/historico"))}
      style={{ paddingVertical: 18 }}
    >
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        📊 Histórico
      </Text>
    </TouchableOpacity>
  </Animated.View>
)}

    </SafeAreaView>
  )
}