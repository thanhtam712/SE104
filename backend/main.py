from bootstrap.app import create_app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    # Run the app with Uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=1,
    )
