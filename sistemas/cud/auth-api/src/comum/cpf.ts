/** Valida CPF pelos dígitos verificadores (RN-CUD-001). Aceita com ou sem máscara. */
export function validarCpf(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '')
  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false

  const calcularDigito = (quantidade: number): number => {
    let soma = 0
    for (let i = 0; i < quantidade; i++) {
      soma += Number(numeros[i]) * (quantidade + 1 - i)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return (
    calcularDigito(9) === Number(numeros[9]) &&
    calcularDigito(10) === Number(numeros[10])
  )
}
