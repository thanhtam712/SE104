FROM python:3.11

RUN apt update 
RUN apt install -y graphviz
RUN apt-get install -y xdg-utils

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# additional dependencies
# RUN pip install openai==1.72.0
# RUN pip install mmengine==0.10.5
# RUN pip install pydantic_ai==0.0.21

RUN apt install poppler-utils -y

COPY . .

# Run the application
CMD ["python", "main.py"]