import { IonButton, IonCheckbox, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonItem, IonList, IonPage, IonProgressBar, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';
import { Tldraw } from '@tldraw/tldraw';
import { useEffect, useRef, useState } from 'react';
import OpenAI from "openai";
import * as htmlToImage from 'html-to-image';
import { MathJax } from 'better-react-mathjax';
import Markdown from 'react-markdown'


const Home: React.FC = () => {
  const upload = useRef(null)
  const [files, setFiles] = useState([])
  const openai = useRef(null)
  const [status, setStatus] = useState("")
  const [question, setQuestion] = useState("")
  useEffect(() => {
    var key = localStorage.getItem("key")
    if (!key) {
      key = prompt("Key")
      localStorage.setItem("key", key)
    }
    openai.current = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  }, [])
  useEffect(() => {
    console.log(question)
  }, [question])
  const thread = useRef(null)
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cogitscholar</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid style={{ height: "100%" }}>
          <IonRow style={{ height: "100%" }}>
            {
              question == "" ?
                <>
                  <IonCol>
                    Upload files to start, you can upload course slides, practise questions, assignments, etc.
                    <br />

                    <IonButton onClick={() => {
                      //@ts-ignore
                      upload.current.click()
                    }}>Upload Files</IonButton>
                    <input onChange={(e) => {
                      setFiles([...e.target.files])
                    }} type="file" accept="image/*,.pdf,.docx" multiple={true} ref={upload} hidden></input>
                    <IonList>
                      {
                        files.map((x, index) => (
                          <IonItem key={index}>{x.name}</IonItem>
                        ))
                      }
                    </IonList>
                    <IonProgressBar type="indeterminate" style={{ visibility: status != "in_progress" ? "hidden" : "visible" }}></IonProgressBar>
                    {
                      files.length == 0 || <IonButton expand='block' onClick={async () => {
                        setStatus("in_progress")
                        const reader = new FileReader();
                        const file_ids = []
                        await Promise.all(files.map(async (x, index) => {
                          const file = await openai.current.files.create({
                            file: x,
                            purpose: "assistants",
                          });
                          file_ids.push(file.id)
                        }))
                        console.log(file_ids.length)
                        thread.current = await openai.current.beta.threads.create({
                          messages: [
                            {
                              "role": "user",
                              "content": "You are an AI tutor, user will upload their study material and you will give more practise questions. You should give multiple choice or short response questions. You give one question at a time, you should not give answer. You will give questions that are similar, do not ask back just give questions. Do not format your response using markdown, instead, use LaTex",
                              "file_ids": file_ids
                            }
                          ]
                        });
                        const run = await openai.current.beta.threads.runs.create(
                          thread.current.id,
                          { assistant_id: "asst_NRPo16m74furPJyI6c33IOYj" }
                        );
                        var intId = setInterval(async () => {
                          const res = await openai.current.beta.threads.runs.retrieve(
                            thread.current.id,
                            run.id
                          );
                          console.log(res.status)
                          if (res.status == "completed") {
                            clearInterval(intId)
                            const threadMessages = await openai.current.beta.threads.messages.list(thread.current.id)
                            setQuestion(threadMessages.data[0].content[0].text)
                          }
                          setStatus(res.status)
                        }, 1000)
                      }}>Go</IonButton>
                    }
                  </IonCol></> : <>
                  <IonCol style={{ fontSize: "30px" }}>
                    <MathJax>
                      {question.value}
                    </MathJax>
                    <IonInput id="ans" placeholder="Input your answer here"></IonInput>
                    <br />
                    {/* <IonCheckbox id="screensot">Submit my scratch with my answer</IonCheckbox> */}
                    <br />
                    <IonButton onClick={async () => {
                      var node = document.getElementById('1');
                      htmlToImage.toBlob(node)
                        .then(async function (blob) {
        
                          const threadMessages = await openai.current.beta.threads.messages.create(
                            thread.current.id,
                            { role: "user", content: "User said: " + document.getElementById("ans").value+". Talk about user's answer before move to next question." }
                          );
                          const run = await openai.current.beta.threads.runs.create(
                            thread.current.id,
                            { assistant_id: "asst_NRPo16m74furPJyI6c33IOYj" }
                          );
                          var intId = setInterval(async () => {
                            const res = await openai.current.beta.threads.runs.retrieve(
                              thread.current.id,
                              run.id
                            );
                            console.log(res.status)
                            if (res.status == "completed") {
                              clearInterval(intId)
                              const threadMessages = await openai.current.beta.threads.messages.list(thread.current.id)
                              setQuestion(threadMessages.data[0].content[0].text)
                            }
                            setStatus(res.status)
                          }, 1000)
                        })
                        // .catch(function (error) {
                        //   console.error('oops, something went wrong!', error);
                        // });


                    }}>Submit</IonButton>
                  </IonCol>
                </>
            }
            <IonCol id="1" style={{ height: "100%" }}>
              Scratch Paper
              <Tldraw />
              <button onClick={() => {
                var node = document.getElementById('1');

                htmlToImage.toPng(node)
                  .then(function (dataUrl) {
                    console.log(dataUrl)
                  })
                  .catch(function (error) {
                    console.error('oops, something went wrong!', error);
                  });
              }}>screenshot</button>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;
