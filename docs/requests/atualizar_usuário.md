fetch("https://[subdominio_da_instancia].atenderbem.com/users/710", {
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
  "body": "{\"fullname\":\"Teste Igor\",\"sipuser\":\"\",\"sippass\":\"\",\"enablesoftphone\":0,\"autoanswer\":0,\"candropqueuecall\":1,\"canaccessabandoned\":1,\"canaccessautosend\":0,\"canreopenchat\":1,\"cancreatetasksforeveryone\":0,\"canreopenotherschat\":1,\"canopennewchat\":1,\"canexportchat\":0,\"canusecopilot\":0,\"allowcopilotscheduler\":0,\"copilotqueue\":0,\"canreadhistorymessages\":0,\"canseechatssummary\":1,\"canrequestaisummary\":1,\"showscoreondashboard\":0,\"chatenabled\":1,\"tasksenabled\":1,\"tasksmonitor\":0,\"autologin\":1,\"locklogout\":0,\"remotelogin\":0,\"partnerpanelaccess\":0,\"limitpulledchats\":0,\"ignorelimitsforblockedchats\":1,\"partnerpanelbillingaccess\":0,\"partnerpanelstyleaccess\":0,\"forcesurvey\":0,\"maxchats\":0,\"max_tickets\":0,\"canconfigticket\":0,\"canuseinternalchat\":1,\"canchangepreferredagents\":0,\"canaccesschatgroups\":0,\"caneditgallery\":0,\"cancreatecampaigns\":0,\"caneditcatalog\":0,\"caneditnews\":0,\"caneditfaq\":0,\"canchoosechattopull\":0,\"keeponline\":0,\"allcontactsgroups\":0,\"enablesupfunctions\":0,\"disableliveview\":0,\"queues\":[200,201],\"fk_visualgroup\":0,\"supQueues\":[],\"contactsgroups\":[],\"botkey\":\"\",\"extid\":null,\"extdata\":null,\"wanumber\":null,\"waid\":null,\"tags\":\"[]\",\"agentsfilter\":[],\"vars\":{},\"pmprofiles\":[],\"aijobdesc\":\"\",\"sector\":\"\",\"job\":\"\",\"description\":\"\",\"pmenabletimelapse\":1,\"pmunproductiveautomation\":0,\"pmattentionautomation\":0,\"pmabsentautomation\":0,\"pmabsentwithmediaautomation\":0,\"pmdayreportautomation\":0,\"pmprofile\":0,\"fk_businesshours_config\":null}",
  "method": "PUT",
  "mode": "cors",
  "credentials": "include"
});