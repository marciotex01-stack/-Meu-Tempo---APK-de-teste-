# Meu Tempo — protótipo Expo

Aplicativo de rotina infantil em que o tempo de estudo libera tempo de jogos.

## O que já funciona

- Tela inicial com missão diária e contador de estudo.
- Regra configurável: 20 minutos de estudo liberam 60 minutos de jogos.
- Botão para iniciar e pausar o estudo.
- Recompensa automática ao completar a meta.
- Histórico visual de atividades.
- Área dos responsáveis protegida por PIN.
- Configuração de tempo de estudo e recompensa.
- Seleção de apps de estudo e jogos com switches.
- Limite diário de jogos.
- Bloqueio manual demonstrativo.
- Navegação entre Início, Histórico e Configurações.

## Como testar no computador

```bash
npm install
npm run web
```

Depois abra o endereço indicado pelo Expo, normalmente `http://localhost:8081`.

## Como testar no Android

1. Instale o **Expo Go** no celular Android.
2. Execute `npm start` neste projeto.
3. Conecte o celular e o computador à mesma rede, ou use o túnel indicado pelo Expo.
4. Leia o QR Code exibido no terminal com o Expo Go.

PIN demonstrativo da área dos responsáveis: **1234**.

## Próxima etapa para virar produto real

A versão atual é um protótipo funcional de interface e regras. Para bloquear aplicativos reais no Android será necessário adicionar permissões de controle de uso, serviço em segundo plano, armazenamento persistente e adequação às políticas da Google Play para controle parental.

## Gerar APK instalável

O projeto já inclui `eas.json` com um perfil `preview` configurado para gerar `.apk`.

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

Quando o build terminar, o EAS exibirá um link para baixar o APK. Abra o link no celular Android, baixe o arquivo e toque nele para instalar. Talvez seja necessário permitir a instalação de aplicativos dessa fonte nas configurações do Android.

Para publicação na Google Play, use o perfil de produção, que gera o formato recomendado `.aab`:

```bash
npx eas-cli@latest build --platform android --profile production
```

## Etapa A: como rodar

1. `npm install`
2. `npx expo install expo-secure-store expo-crypto @react-native-async-storage/async-storage`
3. `npx expo start` e abra no celular com o app Expo Go (mesma rede Wi-Fi).

Já funciona: telas do design, salvamento no aparelho, PIN com hash e bloqueio por tentativas,
recuperação por pergunta de segurança, regras editáveis e virada de dia.
Ainda simulado: contagem de estudo (manual) e bloqueio dos apps (só muda o estado). Vem na Etapa B.

## Gerar o APK pelo GitHub + Codemagic (sem instalar nada no PC)

1. Suba todo o conteudo desta pasta para um repositorio no GitHub (inclua `.gitignore` e `codemagic.yaml`, que sao arquivos ocultos no Windows).
2. No Codemagic, adicione o repositorio como app e escolha a configuracao `codemagic.yaml`.
3. Inicie o workflow "Meu Tempo - APK de teste". Ao terminar, baixe o APK em Artifacts e instale no celular.

O APK gerado e assinado com a chave de teste do Expo. Para a Play Store sera preciso criar uma chave propria (etapa futura).
