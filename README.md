# SakuraBot

SakuraBot is a Discord bot that utilizes the power of the OpenAI GPT-3.5 Turbo model to provide advanced language processing capabilities within your Discord server. With SakuraBot, you can generate natural language responses, engage in conversations, and perform various language-based tasks.

## Features

- **Advanced Language Generation:** SakuraBot leverages the OpenAI GPT-3.5 Turbo model to generate human-like responses to user queries and engage in meaningful conversations.
- **Seamless Integration:** The bot is seamlessly integrated into your Discord server, allowing users to interact with it using commands or by simply chatting with the bot.
- **Customization:** SakuraBot is highly customizable, allowing you to configure its behavior, responses, and other settings according to your preferences.
- **User-friendly Commands:** The bot provides a set of user-friendly commands that make it easy for users to interact with the bot and access its various features.
- **Conversation History:** SakuraBot can maintain a conversation history, allowing it to maintain context and provide coherent responses over multiple messages.
- **Interactive Prompts:** The bot supports interactive prompts, enabling users to have interactive and dynamic conversations with the bot.
- **Multi-channel Support:** SakuraBot can participate in multiple channels within your Discord server, providing language processing capabilities across various channels.
- **Image Reactions:** Users can add the ✉️ reaction to images, and SakuraBot will send the image to the user or DM it to them upon request.


## Installation and Setup

To get started with SakuraBot, follow these steps:

1. Clone the Repository: Clone the SakuraBot repository from GitHub to your local machine.
```bash
git clone https://github.com/misdi/SakuraBot.git
```

2. Install Dependencies: Install the required dependencies by running the following command in the project directory.
```bash
npm install
```

3. Rename Configuration File: In the project directory, rename the file `.env_template` to `.env`.

4. Create Discord Bot: Create a new Discord bot account on the [Discord Developer Portal](https://discord.com/developers/applications). Obtain the bot token.

5. Configure Environment Variables: Open the `.env` file and set the following environment variables:
- `DISCORD_TOKEN`: Set this variable to your Discord bot token obtained from the Discord Developer Portal.
- `OPENAI_ORG`: Set this variable to your OpenAI organization ID. You can register at the [OpenAI Platform](https://platform.openai.com/) to obtain it.
- `OPENAI_KEY`: Set this variable to your OpenAI API key, also obtained from the OpenAI Platform.

6. Start the Bot: Start SakuraBot by running the following command.
```bash
node index.js
```


Please note that steps 4 and 5 require you to have accounts with Discord and OpenAI, respectively. If you don't have these accounts, please sign up for them before proceeding.

For more detailed instructions, please refer to the [Installation Guide](README.md).

## Usage

Once SakuraBot is installed and running, you can interact with the bot in your Discord server.


## Contributing

Contributions to SakuraBot are welcome! If you have any suggestions, bug reports, or feature requests, please open an issue on the GitHub repository. If you'd like to contribute code, please submit a pull request.

## License

SakuraBot is released under the [MIT License](LICENSE).

## Disclaimer

SakuraBot is an open-source project and is not affiliated with or endorsed by OpenAI or Discord. Use the bot responsibly and at your own risk.
