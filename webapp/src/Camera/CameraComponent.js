import React, { useCallback, useState, useRef } from "react";
import {
  Flex,
  View,
  Card,
  Button,
  Input,
  Label,
  Loader,
  useTheme,
} from "@aws-amplify/ui-react";

import { uploadData } from "aws-amplify/storage";
import { post } from "aws-amplify/api";

import Webcam from "react-webcam";
import "@aws-amplify/ui-react/styles.css";
import amplifyconfig from "../amplifyconfiguration.json";

import "./Camera.css";

const CameraComponent = () => {
  const { tokens } = useTheme();
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [firstValues, setFirstValues] = useState({});
  const [isCaptured, setIsCaptured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormEditable, setIsFormEditable] = useState(false);

  const [formValues, setFormValues] = useState({
    zod: "",
    model: "",
    serial: "",
  });

  async function callAPI(payload, path) {
    try {
      const restOperation = post({
        apiName: amplifyconfig.aws_cloud_logic_custom[0].name,
        path: path,
        options: {
          body: payload,
        },
      });
      const { body } = await restOperation.response;
      const response = await body.json();
      return response;
    } catch (e) {
      console.log("POST call failed: ", JSON.parse(e.response.body));
    }
  }

  async function uploadImageToS3(image) {
    setIsLoading(true);
    const imgName = "image_" + Math.random().toString(36).substring(4) + ".jpg";
    // Remove the data URL prefix from the base64 string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    // Convert the base64 string to a Blob
    const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then((r) =>
      r.blob()
    );
    try {
      const result = await uploadData({
        path: imgName,
        data: blob,
        options: {
          contentType: "image/jpeg",
        },
      }).result;
      processImage(imgName);
    } catch (error) {
      console.log("Error : ", error);
    }
  }

  async function processImage(imgName) {
    const S3Bucket = amplifyconfig.aws_user_files_s3_bucket;
    const path = "/bedrock-process-image";
    const imageUrl = "s3://" + S3Bucket + "/" + imgName;
    //const imageUrl = "s3://blogpost-inventory-s3bucket-mjrko34batuy/ABB_Lunga.jpg";
    const payload = {
      assets: {
        images: [
          {
            filename: imageUrl,
          },
        ],
      },
    };
    callAPI(JSON.stringify(payload), path).then((response) => {
      setIsLoading(false);
      updateForm(response.response, imageUrl);
    });
  }

  const updateForm = (d, img) => {
    setFormValues({
      zod: d.OCR.Manufacturer,
      model: d.OCR.Model,
      serial: d.OCR.SerialN,
    });
    setIsFormEditable(true);
    setFirstValues({
      OCR: {
        Manufacturer: d.OCR.Manufacturer,
        Model: d.OCR.Model,
        SerialN: d.OCR.SerialN,
      },
      SimilarityImages: d.SimilarityImages,
      InputImage: img,
    });
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;

    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  };

  const takePhoto = () => {
    setIsCaptured(!isCaptured);
    if (isCaptured) retake();
    else capture();
  };

  const validateData = () => {
    const payload = {
      OCR: {
        Manufacturer: firstValues.OCR?.Manufacturer,
        Model: firstValues.OCR?.Model,
        SerialN: firstValues.OCR?.SerialN,
      },
      UserFeedback: {
        Manufacturer: formValues.zod,
        Model: formValues.model,
        SerialN: formValues.serial,
      },
      InputImage: firstValues.InputImage,
      SimilarityImages: firstValues.SimilarityImages,
    };
    console.log(payload);
    const path = "/validate-data";
    setIsLoading(true);
    callAPI(JSON.stringify(payload), path).then((response) => {
      console.log(response);
      setIsLoading(false);
      alert("Dati correttamente processati");
      retake();
    });
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    uploadImageToS3(imageSrc);
  }, [webcamRef]);

  const retake = () => {
    setIsCaptured(false);
    setImgSrc(null);
    setFormValues({
      zod: "",
      model: "",
      serial: "",
    });
  };

  return (
    <View backgroundColor={tokens.colors.blue[80]} padding='0'>
      <Card padding='0' height={510}>
        <Flex
          direction='row'
          alignItems='flex-start'
          justifyContent='space-between'
          height={650}
        >
          <Flex
            direction='column'
            alignContent='center'
            alignItems='stretch'
            gap='2rem'
            padding='20px'
            className='form-container'
          >
            <Flex direction='column' gap='medium'>
              <Label htmlFor='zod'>Manufacturer:</Label>
              <Input
                id='zod'
                name='zod'
                value={formValues.zod}
                onChange={handleFormChange}
                disabled={!isFormEditable}
              />
            </Flex>
            <Flex direction='column' gap='medium'>
              <Label htmlFor='model'>Model:</Label>
              <Input
                id='model'
                name='model'
                value={formValues.model}
                onChange={handleFormChange}
                disabled={!isFormEditable}
              />
            </Flex>
            <Flex direction='column' gap='medium'>
              <Label htmlFor='serial'>Serial No:</Label>
              <Input
                id='serial'
                name='serial'
                value={formValues.serial}
                onChange={handleFormChange}
                disabled={!isFormEditable}
              />
            </Flex>
            <Button
              type='submit'
              id='submit-button'
              onClick={validateData}
              width='100%'
              disabled={imgSrc === null}
            >
              Invia
            </Button>
          </Flex>
          {isLoading ? (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
                }}
              >
                <Loader width='5rem' height='5rem' />
              </div>
              <img src={imgSrc} alt='screenshot' />
            </>
          ) : (
            <div className='camera-container'>
              {imgSrc === null ? (
                <Webcam
                  screenshotFormat='image/jpeg'
                  ref={webcamRef}
                  height={600}
                  width={700}
                />
              ) : (
                <img src={imgSrc} alt='screenshot' />
              )}
              <Button
                onClick={takePhoto}
                size='large'
                id='capturePhotoButton'
              />
            </div>
          )}
        </Flex>
      </Card>
    </View>
  );
};

export default CameraComponent;
