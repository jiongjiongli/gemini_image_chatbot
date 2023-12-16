import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './ImageChatbot.css'; // Import the CSS for styling


const ImageChatbot = () => {
    // const [imageSrc, setImageSrc] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [question, setQuestion] = useState('');
    const [dialogueHistory, setDialogueHistory] = useState([]);
    const [password, setPassword] = useState('');

    const fileUploaderRef = useRef(null);
    const endHistoryRef = useRef(null);
    const genAIRef = useRef(null);
    const maxLength = 100;
    const apiKeyIssues = ["Method doesn't allow unregistered callers",
        "API key not valid"];

    const handlePasswordChange = (event) => {
      setPassword(event.target.value);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleKeyDown = event => {
        // if (event.key === 'Enter' && event.ctrlKey) {
        //   return;
        // }

        if (event.key === 'Enter') {
          event.preventDefault(); // Prevents the default action of the Enter key
        }

        if (!(event.key === 'Enter' && question.trim() !== '' && selectedFile)) {
          return;
        }

        const userChat = (
            <div className="UserRound">
              <div className="item right">
                  <div className="msg">
                      <p>{question.trim()}</p>
                  </div>
              </div>
              <br clear="both" />
            </div>);

        const robotProcessMsg = "In process...";

        const robotTempChat = (
            <div className="robotRound">
              <div className="item">
                  <div className="icon">
                    <i className="fa fa-user">G</i>
                  </div>
                  <div className="msg">
                      <p>{robotProcessMsg}</p>
                  </div>
              </div>
              <br clear="both" />
            </div>);

        const history = [...dialogueHistory, userChat, robotTempChat];
        setDialogueHistory(history);
        setQuestion('');
        // You would also handle sending the question to the chatbot here

        // Access your API key as an environment variable (see "Set up your API key" above)
        const API_KEY = 'AIzaSyApHgc-LO1egQQk-tELdh0VQ7i1xLtoKPE';
        const genAI = new GoogleGenerativeAI(API_KEY);

        // Converts a File object to a GoogleGenerativeAI.Part object.
        async function fileToGenerativePart(file) {
          const base64EncodedDataPromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
          });
          return {
            inlineData: {
                data: await base64EncodedDataPromise,
                mimeType: file.type },
          };
        }

        async function run() {
          let robotMsg = "";

          try {
                const imageParts = await Promise.all(
                    [fileToGenerativePart(selectedFile)]
                );

                if (!genAIRef.current) {
                    const genAI = new GoogleGenerativeAI(password);
                    // For text-and-image input (multimodal), use the gemini-pro-vision model
                    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision"});

                    genAIRef.current = {genAI, model};
                }

                const result = await genAIRef.current?.model.generateContent([question.trim(), ...imageParts]);
                const response = await result.response;
                robotMsg = response.text();
          } catch (error) {
            console.error("Error occured! " + error); // You might send an exception to your error tracker like AppSignal
            console.error("error.name: " + error.name);
            console.error("error.message: " + error.message);

            for (let apiKeyIssue of apiKeyIssues) {
              if (error.message.includes(apiKeyIssue)) {
                robotMsg = error.message;
                genAIRef.current = null;
                break;
              }
            }

            if (robotMsg.trim() === '') {
              robotMsg = "Internal server error. Please ask another question.";
            }

          }

          if (robotMsg.trim() === '') {
            robotMsg = "Empty response. Please ask another question.";
          }

          const robotChat = (
            <div className="robotRound">
              <div className="item">
                  <div className="icon">
                    <i className="fa fa-user">G</i>
                  </div>
                  <div className="msg">
                      <p>{robotMsg}</p>
                  </div>
              </div>
              <br clear="both" />
            </div>);
          setDialogueHistory([...dialogueHistory, userChat,
                             robotChat]);
        }

        run();

        // console.log('Completed!');
    };

    const handleClearHistory = event => {
        setDialogueHistory([]);
      };

    // Scroll to the end of the divs every time a new div is added
    useEffect(() => {
      endHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [dialogueHistory]);

    return (
        <div className="container">
            <div>
                <div className="title">Gemini Image Chatbot</div>
                <label htmlFor="password" className="password">Gemni API Key: </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
                />
            </div>

            <div className="bottom-section">
                <div className="upload-section">
                    <div className="upload-container">
                        <div
                            className="upload-area"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className="upload-button">
                                <input
                                    type="file"
                                    id="file-upload"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                    accept="image/png, image/jpeg"
                                    ref={fileUploaderRef}
                                />
                                <button
                                    onClick={() => fileUploaderRef.current?.click()}
                                    className="button">
                                    Upload
                                </button>
                                <br />
                                <label className="description">
                                    Drag and drop a file here or click the button above to upload.
                                </label>
                            </div>

                            <div className="image-container">
                                {selectedFile && (
                                <div className="image-area">
                                    {/* <p>File Name: {selectedFile.name}</p> */}
                                    <img src={preview} alt="Preview"
                                        className="image-preview" />
                                </div>
                            )}
                            </div>
                        </div>

                    </div>

                    <div className="question-container">
                        <textarea
                            type="text"
                            name="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={`${maxLength}`}
                            placeholder={`Type your message (max ${maxLength} characters) and press "ENTER" keys to send message.`}
                            >
                        </textarea>
                    </div>
                    <div className="button-container">
                        <button
                            onClick={handleClearHistory}
                            className="button" > Clear History
                        </button>
                    </div>
                </div>
                <div className="dialogue-history box">
                    {
                        dialogueHistory.map((entry, index) => (
                            <div key={index}>
                                {entry}
                            </div>
                        ))
                    }
                    {/* Hidden div for scrolling purpose */}
                    <div ref={endHistoryRef} />
                </div>
            </div>
        </div>
    );
};

export default ImageChatbot;
