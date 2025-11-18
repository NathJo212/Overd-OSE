import 'package:flutter/material.dart';
import 'package:frontend_mobile/widgets/home_widget.dart';

class home extends StatefulWidget {
  const home({super.key});

  
  @override
  State<home> createState() => _homeState();
}

class _homeState extends State<home> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).primaryColor,
      body: HomeWidget(),
    );
  }
}