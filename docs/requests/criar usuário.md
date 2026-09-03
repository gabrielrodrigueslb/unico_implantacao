fetch("https://[subdominio_da_instancia].atenderbem.com/users", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "pt,en-US;q=0.9,en;q=0.8",
    "authorization": "Bearer [bearer recebido ao realizar o login ]",
    "content-type": "application/json",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not=A?Brand\";v=\"99\", \"Google Chrome\";v=\"151\", \"Chromium\";v=\"151\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  },
  "referrer": "https://ambientesdetesteunicocontato.atenderbem.com/base/config/userslist",
  "body": "{\"username\":\"login_usuario\",\"fullname\":\"nome do usuário\",\"password\":\"senha_ESCOLHIDA\",\"sipuser\":\"\",\"sippass\":\"\",\"type\":2,\"status\":1,\"changepass\":0,\"showscoreondashboard\":0,\"botkey\":\"\",\"tasksenabled\":1,\"chatenabled\":1,\"autologin\":1,\"canrequestaisummary\":1,\"ignorelimitsforblockedchats\":1,\"canreopenchat\":1,\"canreopenotherschat\":1,\"canopennewchat\":1,\"canuseinternalchat\":1}",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});

types identificados
agente: 2
supervisor (necessário informar o ramal{sipuser
}):1 
administrador (necessário informar o ramal{sipuser
}):0


response (exemplo sanitizado): {"username":"login_usuario","fullname":"nome do usuário","type":2,"status":1,"tasksenabled":1,"chatenabled":1,"autologin":1,"canrequestaisummary":1,"ignorelimitsforblockedchats":1,"canreopenchat":1,"canreopenotherschat":1,"canopennewchat":1,"canuseinternalchat":1,"createdAt":"<timestamp>","updatedAt":"<timestamp>","id":<id>}

> A resposta real pode conter campos opacos de acesso, como chaves de socket
> ou criptografia. Eles não são necessários para provisionar o usuário e não
> devem ser gravados, exibidos ou reutilizados.

Para usuários já existentes, buscar a representação completa com `GET /users/{id}`
e fazer `PUT /users/{id}` preservando os demais campos e aplicando as mesmas
permissões acima. O `GET /users/getUsers` é somente uma lista reduzida e não
deve servir de base para o `PUT`.
