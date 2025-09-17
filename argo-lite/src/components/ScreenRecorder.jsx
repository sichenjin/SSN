import React, { useState, useRef } from "react";
import { Button, Tooltip, Position } from "@blueprintjs/core";

const ScreenRecorder = () => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const combinedStreamRef = useRef(null);

  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const combinedStream = new MediaStream([...screenStream.getTracks(), ...micStream.getTracks()]);
      combinedStreamRef.current = combinedStream;

      combinedStream.getTracks().forEach((track) => {
        track.onended = () => {
          console.log("Track ended (user stopped sharing)");

          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }

          // Ensure Start button reappears immediately
          setRecording(false);
        };
      });

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: "video/webm; codecs=vp9" });
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // Reset recording state BEFORE download
        setRecording(false);

        // Delay download slightly to ensure React re-renders
        setTimeout(() => {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = `recording-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);

          combinedStream.getTracks().forEach((track) => track.stop());
          combinedStreamRef.current = null;
        }, 50);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch (err) {
      console.error("Could not start recording:", err);
      alert("Recording failed or permission denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Ensure Start button reappears immediately
    setRecording(false);
  };

  return (
    <div style={{ display: "inline-block", marginLeft: "1rem" }}>
      <Tooltip
        content={recording ? "Click to stop recording" : "Click to start recording"}
        position={Position.BOTTOM}
      >
        <Button
          icon={recording ? "stop" : "record"}
          text={recording ? "Stop Recording" : "Start Recording"}
          intent={recording ? "danger" : "primary"}
          onClick={recording ? stopRecording : startRecording}
          style={{ minWidth: "140px" }}
        />
      </Tooltip>
    </div>
  );
};

export default ScreenRecorder;
