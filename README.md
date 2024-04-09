# DiscordBot_With_Gemini
專為Discord寫的Gemini 對話機器人 AI
目前版本是 4.1
利用了Node js環境、Gemini還有Discordjs架起來的

本項目由Javascript驅動，環境為
> Node js v21.7.1
> 
> Discord.js v14
>
> Gemini Pro 1.0

就..呃，就是想練習?
||別想了我只是想要女朋友罷了||

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
要然後要創建一個 history 的資料夾
用於保存歷史紀錄

要然後要創建一個 config 的資料夾，用於機器人資訊設定
你可以放很多隻機器人沒問題，等下啟動時會選取
> 記得打開副檔名顯示，網路上都有教
在裡面創建一個隨便你想叫啥的json
假設叫做 **天喵.json**
裡面的東西就是
```json
{
    "discord":{
        "token": "Discord Token",
        "client_id": "Discord Client ID"
    },
    "gemini":{
        "token": "Gemini Token"
    },
    "bot_setting":{
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
    "global_setting":{
        "prompt_strength": "機器人prompt強度，(1 ~ 0.1) 越高越強",
        "chat_history": "機器人聊天紀錄筆數 (0 ~ 100) 數值越小速度越快，越大則上下文越強",
        "nsfw": "是否開啟機器人nsfw功能 (true/false)",
        "nsfw_all" : "是否開啟機器人對全使用者nsfw功能 (true/false)",
        "reference": "是否開啟機器人回應功能 (true/false)"
    },
    "developer":{
        "id":"機器人開發者ID，也就是你的Discord ID"
    }
}
```

然後Prompt資料夾中的prompt_txt裡面都是提示詞
裡面怎麼訓練你家的事
畫表格吧
| 資料檔 | 對應意思 |
| Category_chat_prompt.txt | 分類用系統提示詞 |
| Category_prompt.txt | 分類用數據 |
| Chat_prompt.txt | 每次聊天時，會調用的提示詞 |
| History_start_prompt.txt | 歷史紀錄開始提示詞 |
| System_prompt.txt | 系統提示詞 |

然後Prompt資料夾中的prompt_setting裡面都是訓練紀錄
你可以找出規律自己修改
一樣畫表格
| 檔案 | 功能 |
| Category_permissions.json | 這個是權限設定，後續再說 |
| Category_Train.json | 分類訓練，可以自己調整 |
| Chat_Train.json | 對話訓練，可以自己調整，底下的參數等下會說 |

# 權限，參數
OK，說說權限吧，先畫上表格
| 權限 | 功能 |
| 資料 | 讀取資料(目前版本沒有研究，後續的) |
| 生日 | 取得機器人生日。config 中 bot_setting.birthday 參數 |
| 時間 | 會取得你電腦的時間 |
| 年齡 | 取得機器人的年紀 |
| 天氣 | 取得天氣(目前版本沒有研究，後續的) |
| 開發者 | 取得開發者(主人)的名稱+ID |

如果你有在 Category_permissions.json 添加這些參數，那他自己會加入到 Chat_prompt.txt 中 {__OTHER_PROMPT}

在來是 Chat_Train.json 中的參數
input 是 使用者輸入
output 是 機器人輸出
category 是 分類，他會使訓練紀錄的格式統一標準化
other_param 是其他參數

| 其他參數 | 意義 |
| data | 如果沒有資料，no_data |
| time | 給機器人一個模擬時間 |
| is_Developer | 這是要模擬開發者回應嗎? |

好，data 只有當 分類包含 "資料" 權限功能的時候才會讀
time 就是同理，只有當分類包含"時間"的權限功能時才會讀取
is_Developer 是通用的，只要這個是true，他就是會將該對話換成和主人溝通的模式

# 最後
```
node .\Discord_Bot.js
```

# 功能一覽
包含了 預設加入身分組、反應身分組新增、認證身分組。
