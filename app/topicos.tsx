import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"

export default function Topicos() {
  const router = useRouter()

  const [estrutura, setEstrutura] = useState<Record<string, string[]>>({})

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const salvo = await AsyncStorage.getItem("@topicos_checklist")
    if (salvo) {
      setEstrutura(JSON.parse(salvo))
    }
  }

  function adicionarSecao() {
    const nome = `Nova Seção ${Object.keys(estrutura).length + 1}`
    setEstrutura({ ...estrutura, [nome]: [] })
  }

  function adicionarItem(secao: string) {
    const novo = [...estrutura[secao], "Novo item"]
    setEstrutura({ ...estrutura, [secao]: novo })
  }

  function editarItem(secao: string, index: number, valor: string) {
    const copia = [...estrutura[secao]]
    copia[index] = valor
    setEstrutura({ ...estrutura, [secao]: copia })
  }

  function editarSecao(nomeAntigo: string, novoNome: string) {
    const novaEstrutura: Record<string, string[]> = {}
    Object.keys(estrutura).forEach((secao) => {
      if (secao === nomeAntigo) {
        novaEstrutura[novoNome] = estrutura[secao]
      } else {
        novaEstrutura[secao] = estrutura[secao]
      }
    })
    setEstrutura(novaEstrutura)
  }

  async function salvar() {
    await AsyncStorage.setItem("@topicos_checklist", JSON.stringify(estrutura))
    router.back()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <ScrollView style={{ padding: 20 }}>

        <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
          Editar Tópicos
        </Text>

        {Object.entries(estrutura).map(([secao, itens]) => (
          <View key={secao} style={{ marginBottom: 20 }}>

            {/* Nome da seção */}
            <TextInput
              value={secao}
              onChangeText={(text) => editarSecao(secao, text)}
              style={{
                backgroundColor: "#ddd",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
                fontWeight: "bold",
              }}
            />

            {/* Itens */}
            {itens.map((item, index) => (
              <TextInput
                key={index}
                value={item}
                onChangeText={(text) => editarItem(secao, index, text)}
                style={{
                  backgroundColor: "#fff",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />
            ))}

            <TouchableOpacity onPress={() => adicionarItem(secao)}>
              <Text style={{ color: "#2563eb", marginTop: 5 }}>
                + Adicionar Item
              </Text>
            </TouchableOpacity>

          </View>
        ))}

        <TouchableOpacity onPress={adicionarSecao}>
          <Text style={{ fontSize: 18, color: "#16a34a", marginBottom: 20 }}>
            + Nova Seção
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={salvar}
          style={{
            backgroundColor: "#22c55e",
            padding: 16,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            Salvar
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}