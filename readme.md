# DiscordBot_With_Gemini
專為Discord寫的Gemini 對話機器人 AI

目前版本是 4.2

利用了Node js環境、Gemini還有Discordjs架起來的

本項目由Javascript驅動，環境為

> Node js v21.7.1
> 
> Discord.js v14
>
> Gemini Pro 1.0

就..呃，就是想練習?

~~別想了我只是想要女朋友罷了~~

# 安裝、開始使用
必要插件有 Discord.js

下載，解壓縮，在該資料夾中開啟cmd

安裝Discord.js
```cmd
npm i discord.js@14.0.0
```

安裝Gemini
```cmd
npm install @google/generative-ai
```

# 初次使用
## 關於歷史紀錄
要創建一個 history 的資料夾

用於保存歷史紀錄

## 關於機器人參數
要然後要創建一個 config 的資料夾，用於機器人資訊設定

你可以放很多隻機器人沒問題，等下啟動時會選取

> 記得打開副檔名顯示，網路上都有教

在裡面創建一個隨便 你想叫啥 + _Config 的json

假設叫做 **天喵_Config.json**

裡面的東西就是

```json
{
    "discord":{
        "token": "Discord Token",
        "client_id": "Discord Client ID"
    },
    "gemini":{
        "token": "Gemini API Token"
    },
    "openweathermap":{
        "token": "openweathermap API Token"
    },
    "bot_setting":{
        "chat":{
            "prompt_strength": "提示詞強度1~10",
            "history": "歷史紀錄",
            "chat_history": "最大的歷史紀錄"
        },
        "nsfw":{
            "enabled": "啟用nsfw?(對主人)",
            "all_user": "開放給所有人?"
        },
        "reference": "回應功能"
    },
    "bot_config":{
        "name":"機器人名稱",
        "birthday": "機器人生日",
        "personality": "機器人個性",
        "gender": "機器人性別",
        "profession": "機器人職業",
        "hobby": "機器人興趣",
        "like": "機器人喜歡的事物",
        "language": [
            "繁體中文"
        ]
    },
    "developer":{   
        "id":"your id"
    },
    "system_setting":{
        "train_data":"這個會去讀personality_profile裡面的資料，可以參考Default，只要找不到，預設讀取Default",
        "version":"4.2p"
    }
}
```

## 關於提示詞和參數


# 最後
```
node .\Discord_Bot.js
```

# 功能一覽
AI回應，包括回覆回應，還有十分感謝Google開放安全性，太感謝了，讓機器人的社區更加完整強大。
