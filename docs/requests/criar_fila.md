request paras criar fila:
fetch("https://[subdominio_da_instancia].atenderbem.com/queues", {
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
  "referrer": "https://ambientesdetesteunicocontato.atenderbem.com/base/config/queueslist",
  "body": "{\"name\":\"fila\",\"type\":21,\"status\":1,\"enabled\":0,\"maxchatsperagent\":5,\"ivrid\":0}",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});

response: {"name":"fila","type":21,"status":1,"enabled":0,"maxchatsperagent":5,"ivrid":0,"createdAt":"2026-09-02T01:21:24.421Z","updatedAt":"2026-09-02T01:21:24.421Z","id":207}

types identificados:

- WA Cloud API (whatsapp api oficial): 21
- IG Messenger (instagram): 12
- FB Messenger (facebook): 2
- TG (TELEGRAM): 3 
