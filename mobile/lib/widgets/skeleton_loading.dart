import 'package:flutter/material.dart';

class SkeletonBox extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const SkeletonBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: const [
                Color(0xFFEBEBEB),
                Color(0xFFF4F4F4),
                Color(0xFFEBEBEB),
              ],
              stops: [
                0.1,
                0.5 + (_animation.value / 4),
                0.9,
              ],
            ),
          ),
        );
      },
    );
  }
}

class HeaderCardSkeleton extends StatelessWidget {
  const HeaderCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFE0E0E0),
        borderRadius: BorderRadius.circular(25),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              SkeletonBox(width: 100, height: 12),
              SkeletonBox(width: 60, height: 12),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              SkeletonBox(width: 140, height: 28),
              SkeletonBox(width: 40, height: 40, borderRadius: 20),
            ],
          ),
        ],
      ),
    );
  }
}

class ListItemSkeleton extends StatelessWidget {
  const ListItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          const SkeletonBox(width: 40, height: 40, borderRadius: 12),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                SkeletonBox(width: 120, height: 12),
                SizedBox(height: 8),
                SkeletonBox(width: 180, height: 10),
              ],
            ),
          ),
          const SkeletonBox(width: 40, height: 12),
        ],
      ),
    );
  }
}

/// Skeleton for screens with a header card + list below (Leave, Salary, etc.)
class CardAndListSkeleton extends StatelessWidget {
  final int listCount;

  const CardAndListSkeleton({super.key, this.listCount = 4});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const HeaderCardSkeleton(),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: listCount,
            itemBuilder: (context, index) => const ListItemSkeleton(),
          ),
        ),
      ],
    );
  }
}

/// Skeleton for simple list screens (Holiday, Notification, etc.)
class SimpleListSkeleton extends StatelessWidget {
  final int count;
  final EdgeInsets padding;

  const SimpleListSkeleton({
    super.key,
    this.count = 6,
    this.padding = const EdgeInsets.all(20),
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: padding,
      itemCount: count,
      itemBuilder: (context, index) => const ListItemSkeleton(),
    );
  }
}

class DocumentListSkeleton extends StatelessWidget {
  const DocumentListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 6,
      itemBuilder: (context, index) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const SkeletonBox(width: 48, height: 48, borderRadius: 10),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonBox(width: 150, height: 14),
                  SizedBox(height: 8),
                  SkeletonBox(width: 100, height: 10),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}

/// Skeleton for profile screen
class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 20),
          const SkeletonBox(width: 100, height: 100, borderRadius: 50),
          const SizedBox(height: 16),
          const SkeletonBox(width: 160, height: 18),
          const SizedBox(height: 8),
          const SkeletonBox(width: 120, height: 14),
          const SizedBox(height: 30),
          ...List.generate(
            5,
            (index) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: const [
                    SkeletonBox(width: 40, height: 40, borderRadius: 10),
                    SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SkeletonBox(width: 80, height: 11),
                          SizedBox(height: 6),
                          SkeletonBox(width: 150, height: 14),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Skeleton for KPI / Leaderboard screens with cards
class KpiSkeleton extends StatelessWidget {
  const KpiSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Score card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFE0E0E0),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: const [
                SkeletonBox(width: 100, height: 12),
                SizedBox(height: 12),
                SkeletonBox(width: 80, height: 40),
                SizedBox(height: 12),
                SkeletonBox(width: 160, height: 12),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // List items
          ...List.generate(4, (index) => const ListItemSkeleton()),
        ],
      ),
    );
  }
}

/// Skeleton for salary screen
class SalarySkeleton extends StatelessWidget {
  const SalarySkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Month selector
          const SkeletonBox(width: double.infinity, height: 50, borderRadius: 12),
          const SizedBox(height: 20),
          // Salary card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFE0E0E0),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                SkeletonBox(width: 100, height: 12),
                SizedBox(height: 10),
                SkeletonBox(width: 180, height: 28),
                SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: 80, height: 10),
                        SizedBox(height: 6),
                        SkeletonBox(width: 100, height: 16),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        SkeletonBox(width: 80, height: 10),
                        SizedBox(height: 6),
                        SkeletonBox(width: 100, height: 16),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Breakdown items
          ...List.generate(
            5,
            (index) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  SkeletonBox(width: 140, height: 14),
                  SkeletonBox(width: 100, height: 14),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(25),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Skeleton
          Row(
            children: [
              const SkeletonBox(width: 50, height: 50, borderRadius: 25),
              const SizedBox(width: 15),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonBox(width: 100, height: 12),
                  SizedBox(height: 8),
                  SkeletonBox(width: 150, height: 18),
                ],
              ),
            ],
          ),
          const SizedBox(height: 30),
          // Attendance Card Skeleton
          const SkeletonBox(width: double.infinity, height: 160, borderRadius: 25),
          const SizedBox(height: 30),
          // Menu Grid Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              SkeletonBox(width: 120, height: 20),
              SkeletonBox(width: 60, height: 20),
            ],
          ),
          const SizedBox(height: 20),
          // Menu Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 5,
              mainAxisSpacing: 0,
              crossAxisSpacing: 8,
              childAspectRatio: 0.7,
            ),
            itemCount: 5,
            itemBuilder: (context, index) => Column(
              children: const [
                SkeletonBox(width: 50, height: 50, borderRadius: 25),
                SizedBox(height: 8),
                SkeletonBox(width: 40, height: 10),
              ],
            ),
          ),
          const SizedBox(height: 30),
          // Announcements Header
          const SkeletonBox(width: 150, height: 20),
          const SizedBox(height: 15),
          // Horizontal List Skeleton
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 3,
              itemBuilder: (context, index) => Container(
                width: 250,
                margin: const EdgeInsets.only(right: 15),
                child: const SkeletonBox(width: 250, height: 100, borderRadius: 15),
              ),
            ),
          ),
          const SizedBox(height: 30),
          // Holidays Header
          const SkeletonBox(width: 140, height: 20),
          const SizedBox(height: 15),
          // More content
          const SkeletonBox(width: double.infinity, height: 80, borderRadius: 15),
        ],
      ),
    );
  }
}
