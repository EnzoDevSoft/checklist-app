import { useEffect, useState, useMemo } from "react"
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/src/services/firebase"
import { LineChart, PieChart } from "react-native-chart-kit"

const screenWidth = Dimensions.get("window").width

type Auditoria = {
  id: string
  timestamp?: string
  dados: Record<string, number>
}

export default function Dashboard() {
  const [historico, setHistorico] = useState<Auditoria[]>([])
  const [tipoGrafico, setTipoGrafico] = useState<"linha" | "pizza">("linha")
  const [filtro, setFiltro] = useState<"hoje" | "7dias" | "30dias">("7dias")

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const snapshot = await getDocs(collection(db, "auditorias"))

    const lista: Auditoria[] = []

    snapshot.forEach((doc) => {
      lista.push({
        id: doc.id,
        ...doc.data(),
      } as Auditoria)
    })

    setHistorico(lista.reverse())
  }

  
  const dadosFiltrados = useMemo(() => {
    const agora = new Date()

    return historico.filter((item) => {
      const data = new Date(item.timestamp || item.id)

      if (filtro === "hoje") {
        return data.toDateString() === agora.toDateString()
      }

      if (filtro === "7dias") {
        const diff =
          (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 7
      }

      if (filtro === "30dias") {
        const diff =
          (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 30
      }

      return true
    })
  }, [historico, filtro])

  
  const medias = useMemo(() => {
    return dadosFiltrados.map((item) => {
      const valores = Object.values(item.dados)
      const soma = valores.reduce((a, b) => a + b, 0)
      return valores.length ? soma / valores.length : 0
    })
  }, [dadosFiltrados])

   
  const mediaGeral = useMemo(() => {
    if (!medias.length) return 0
    const soma = medias.reduce((a, b) => a + b, 0)
    return (soma / medias.length).toFixed(2)
  }, [medias])

  
  const distribuicao = useMemo(() => {
    return [
      {
        name: "Ruim",
        population: medias.filter((m) => m < 1.5).length,
        color: "#ef4444",
        legendFontColor: "#000",
        legendFontSize: 12,
      },
      {
        name: "Médio",
        population: medias.filter((m) => m >= 1.5 && m < 2.5).length,
        color: "#f59e0b",
        legendFontColor: "#000",
        legendFontSize: 12,
      },
      {
        name: "Bom",
        population: medias.filter((m) => m >= 2.5).length,
        color: "#22c55e",
        legendFontColor: "#000",
        legendFontSize: 12,
      },
    ]
  }, [medias])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
          Dashboard 📈
        </Text>

         
        <View style={{
          flexDirection: "row",
          marginBottom: 15,
          gap: 10,
        }}>
          {[
            { label: "Hoje", value: "hoje" },
            { label: "7 dias", value: "7dias" },
            { label: "30 dias", value: "30dias" },
          ].map((f) => {
            const ativo = filtro === f.value

            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setFiltro(f.value as any)}
                style={{
                  flex: 1,
                  padding: 10,
                  backgroundColor: ativo ? "#22c55e" : "#e5e7eb",
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{
                  color: ativo ? "#fff" : "#000",
                  fontWeight: "600",
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

       
        <View style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 16,
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 16, color: "#6b7280" }}>
            Média geral
          </Text>

          <Text style={{ fontSize: 28, fontWeight: "bold" }}>
            {mediaGeral}/3
          </Text>

          <Text style={{ marginTop: 10 }}>
            📋 Auditorias: {dadosFiltrados.length}
          </Text>
        </View>

        
        <View style={{
          flexDirection: "row",
          marginBottom: 15,
          gap: 10,
        }}>
          <TouchableOpacity
            onPress={() => setTipoGrafico("linha")}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: tipoGrafico === "linha" ? "#22c55e" : "#e5e7eb",
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{
              color: tipoGrafico === "linha" ? "#fff" : "#000",
              fontWeight: "600",
            }}>
              📈 Linha
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTipoGrafico("pizza")}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: tipoGrafico === "pizza" ? "#22c55e" : "#e5e7eb",
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{
              color: tipoGrafico === "pizza" ? "#fff" : "#000",
              fontWeight: "600",
            }}>
              🍕 Pizza
            </Text>
          </TouchableOpacity>
        </View>

      
        {tipoGrafico === "linha" && medias.length > 0 && (
          <LineChart
            data={{
              labels: medias.map((_, i) => `${i + 1}`),
              datasets: [{ data: medias }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 2,
              color: () => "#22c55e",
              labelColor: () => "#6b7280",
            }}
            style={{ borderRadius: 16 }}
          />
        )}

      
        {tipoGrafico === "pizza" && medias.length > 0 && (
          <PieChart
            data={distribuicao}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              color: () => "#000",
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        )}

      </ScrollView>
    </SafeAreaView>
  )
}