import { useState, useCallback, useRef, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from "react-native"
import { useFocusEffect, useRouter } from "expo-router"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/src/services/firebase"

type Auditoria = {
  id: string
  loja?: string
  data?: string
  auditor?: string
  responsavel?: string
  preenchedor?: string
  timestamp?: string
  dados: Record<string, number>
}

function AnimatedCard({ children, index }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  )
}

export default function Historico() {
  const [historico, setHistorico] = useState<Auditoria[]>([])
  const [filtro, setFiltro] = useState<"hoje" | "7dias" | "todos">("todos")
  const router = useRouter()

  useFocusEffect(
    useCallback(() => {
      carregarHistorico()
    }, [])
  )

  async function carregarHistorico() {
    try {
      const querySnapshot = await getDocs(collection(db, "auditorias"))
      const lista: Auditoria[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        lista.push({
          id: doc.id,
          loja: data.loja || "",
          data: data.data || "",
          auditor: data.auditor || "",
          responsavel: data.responsavel || "",
          timestamp: data.timestamp || doc.id,
          dados: data.dados || {},
        } as Auditoria)
      })

      lista.sort((a, b) => {
        const aTime = new Date(a.timestamp || a.id).getTime()
        const bTime = new Date(b.timestamp || b.id).getTime()
        return bTime - aTime
      })

      setHistorico(lista)
    } catch (error) {
      console.log("Erro ao carregar histórico:", error)
    }
  }

  function calcularMedia(dados: Record<string, number>) {
    const valores = Object.values(dados || {})
    if (!valores.length) return 0
    const soma = valores.reduce((a, b) => a + b, 0)
    return soma / valores.length
  }

  function filtrar() {
    const hoje = new Date()
    return historico.filter((item) => {
      const dataItem = new Date(item.timestamp || item.id)
      if (filtro === "hoje") return dataItem.toDateString() === hoje.toDateString()
      if (filtro === "7dias") {
        const diff = (hoje.getTime() - dataItem.getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 7
      }
      return true
    })
  }

  const dadosFiltrados = filtrar()

  function renderItem(item: Auditoria, index: number) {
    const media = calcularMedia(item.dados)
    const dataFormatada = new Date(item.timestamp || item.id).toLocaleString("pt-BR")

    return (
      <AnimatedCard index={index}>
        <View style={{
          backgroundColor: "#fff",
          padding: 18,
          borderRadius: 16,
          marginBottom: 12,
          borderLeftWidth: 5,
          borderLeftColor: "#22c55e",
        }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>📅 {dataFormatada}</Text>

          {!!item.loja && (
            <Text style={{ fontSize: 18, marginTop: 4 }}>🏪 {item.loja}</Text>
          )}

          {!!item.auditor && (
            <Text style={{ fontSize: 15, marginTop: 4, color: "#374151" }}>
              👤 Auditor: {item.auditor}
            </Text>
          )}

          {!!item.responsavel && (
            <Text style={{ fontSize: 15, marginTop: 2, color: "#374151" }}>
              🙋 Responsável: {item.responsavel}
            </Text>
          )}

          <Text style={{ marginTop: 8 }}>⭐ Média: {media.toFixed(2)}/3</Text>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/detalhes",
                params: {
                  dados: JSON.stringify(item.dados),
                  auditor: item.auditor || "",
                  responsavel: item.responsavel || "",
                  loja: item.loja || "",
                  data: item.data || "",
                },
              })
            }
            style={{
              marginTop: 12,
              backgroundColor: "#22c55e",
              padding: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Ver detalhes</Text>
          </TouchableOpacity>
        </View>
      </AnimatedCard>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", padding: 20 }}>Histórico 📊</Text>

      {/* Filtros */}
      <View style={{
        marginHorizontal: 20,
        marginBottom: 15,
        backgroundColor: "#e5e7eb",
        borderRadius: 12,
        flexDirection: "row",
        padding: 4,
      }}>
        {[
          { label: "Hoje", value: "hoje" },
          { label: "7 dias", value: "7dias" },
          { label: "Todos", value: "todos" },
        ].map((f) => {
          const ativo = filtro === f.value
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFiltro(f.value as any)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: ativo ? "#fff" : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "600" }}>{f.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <FlatList
        data={dadosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item, index }) => renderItem(item, index)}
      />
    </SafeAreaView>
  )
}
